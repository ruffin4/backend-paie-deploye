/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BulletinPaieEntity, StatutBulletin } from './entities/bulletin.entity';
import { CreateBulletinDto } from './dto/create-bulletin.dto';
import { UpdateBulletinDto } from './dto/update-bulletin.dto';
import { EmployeService } from '../employe/employe.service';
import { PeriodeService } from '../periode/periode.service';
import { VariableMensuelleService } from '../variable-mensuelle/variable-mensuelle.service';
import { RubriqueService } from '../rubrique/rubrique.service';
import { TypeRubrique } from '../rubrique/entities/rubrique.entity';
import { CotisationService } from '../cotisation/cotisation.service';
import { BarreIrsaService } from '../barre-irsa/barre-irsa.service';
import { LigneBulletinService } from '../ligne-bulletin/ligne-bulletin.service';
import { CalculIrsaService } from '../calcul-irsa/calcul-irsa.service';

@Injectable()
export class BulletinService {
  constructor(
    @InjectRepository(BulletinPaieEntity)
    private readonly bulletinRepository: Repository<BulletinPaieEntity>,
    private readonly employeService: EmployeService,
    private readonly periodeService: PeriodeService,
    private readonly variableService: VariableMensuelleService,
    private readonly rubriqueService: RubriqueService,
    private readonly cotisationService: CotisationService,
    private readonly barreIrsaService: BarreIrsaService,
    private readonly ligneBulletinService: LigneBulletinService,
    private readonly calculIrsaService: CalculIrsaService,
  ) {}

  /**
   * Crée un nouveau bulletin
   */
  async create(createDto: CreateBulletinDto): Promise<BulletinPaieEntity> {
    // Vérifier si l'employé existe
    await this.employeService.findOne(createDto.employeUuid);

    // Vérifier si la période existe
    await this.periodeService.findOne(createDto.periodeUuid);

    // Vérifier si un bulletin existe déjà pour cette période
    const existing = await this.bulletinRepository.findOne({
      where: {
        employeUuid: createDto.employeUuid,
        periodeUuid: createDto.periodeUuid,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Un bulletin existe déjà pour cette période',
      );
    }

    if (await this.periodeService.isClosed(createDto.periodeUuid)) {
      throw new BadRequestException('La période est clôturée');
    }

    const bulletin = this.bulletinRepository.create(createDto);
    return this.bulletinRepository.save(bulletin);
  }

  /**
   * Récupère tous les bulletins
   */
  async findAll(): Promise<BulletinPaieEntity[]> {
    return this.bulletinRepository.find({
      relations: ['employe', 'periode'],
      select: {
        uuid: true,
        dateEdition: true,
        statut: true,
        salaireBrut: true,
        netAPayer: true,
        employe: {
          uuid: true,
          nom: true,
          prenom: true,
          matriculeInterne: true,
        },
        periode: {
          uuid: true,
          mois: true,
          annee: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupère les bulletins d'un employé
   */
  async findByEmploye(employeUuid: string): Promise<BulletinPaieEntity[]> {
    return this.bulletinRepository.find({
      where: { employeUuid },
      relations: ['periode'],
      select: {
        uuid: true,
        dateEdition: true,
        statut: true,
        salaireBrut: true,
        netAPayer: true,
        periode: {
          uuid: true,
          mois: true,
          annee: true,
        },
      },
      order: { periode: { annee: 'DESC', mois: 'DESC' } },
    });
  }

  /**
   * Récupère les bulletins d'une période
   */
  async findByPeriode(periodeUuid: string): Promise<BulletinPaieEntity[]> {
    return this.bulletinRepository.find({
      where: { periodeUuid },
      relations: ['employe'],
      select: {
        uuid: true,
        dateEdition: true,
        statut: true,
        salaireBrut: true,
        netAPayer: true,
        employe: {
          uuid: true,
          nom: true,
          prenom: true,
          matriculeInterne: true,
        },
      },
    });
  }

  /**
   * Récupère un bulletin par son UUID
   */
  async findOne(uuid: string): Promise<BulletinPaieEntity> {
    const bulletin = await this.bulletinRepository.findOne({
      where: { uuid },
      relations: [
        'employe',
        'periode',
        'lignes',
        'lignes.rubrique',
        'calculIrsa',
      ],
      select: {
        uuid: true,
        dateEdition: true,
        statut: true,
        salaireBrut: true,
        totalRetenues: true,
        totalCotisationsPatronales: true,
        netAPayer: true,
        commentaire: true,
        employe: {
          uuid: true,
          nom: true,
          prenom: true,
          matriculeInterne: true,
          categorie: true,
          fonction: true,
          typeContrat: true,
          dateEmbauche: true,
        },
        periode: {
          uuid: true,
          mois: true,
          annee: true,
        },
        lignes: {
          uuid: true,
          base: true,
          taux: true,
          montantSalarie: true,
          montantEmployeur: true,
          reference: true,
          rubrique: {
            uuid: true,
            code: true,
            libelle: true,
            type: true,
            modeCalcul: true,
            inclusDansBrut: true,
          },
        },
        calculIrsa: {
          uuid: true,
          baseImposable: true,
          abattement: true,
          totalImpot: true,
          decote: true,
          nbEnfants: true,
        },
      },
    });

    if (!bulletin) {
      throw new NotFoundException(`Bulletin avec l'UUID "${uuid}" non trouvé`);
    }
    return bulletin;
  }

  /**
   * Calcule automatiquement un bulletin
   *
   * Règles de paie Madagascar :
   * - GAIN, PRIME, AVANTAGE_NATURE  → inclus dans le salaire brut (base cotisations)
   * - INDEMNITE                     → NON inclus dans le brut, mais affiché sur le bulletin
   * - RETENUE                       → déduite du net
   */
  async calculerBulletin(
    employeUuid: string,
    periodeUuid: string,
    date?: Date,
  ): Promise<BulletinPaieEntity> {
    const dateCalcul = date || new Date();

    // 1. Récupérer l'employé et la période
    const employe = await this.employeService.findOne(employeUuid);
    const periode = await this.periodeService.findOne(periodeUuid);

    // 2. Vérifier que la période n'est pas clôturée
    if (periode.cloturee) {
      throw new BadRequestException(
        'Cette période est clôturée, modification impossible',
      );
    }

    // 3. Récupérer les variables mensuelles
    const variables = await this.variableService.findByEmployeAndPeriode(
      employeUuid,
      periodeUuid,
    );

    // 4. Récupérer toutes les rubriques
    const rubriques = await this.rubriqueService.findAll();

    // 5. Calculer le salaire brut (base = salaire de base de l'employé)
    let salaireBrut = Number(employe.salaireBaseMensuel) || 0;
    let totalExonere = 0; // Pour les indemnités sur justificatifs (hors brut)

    // ✅ NOUVEAU : Bases spécifiques pour cotisations et impôts
    let baseCNaPS = Number(employe.salaireBaseMensuel) || 0;
    let baseOSTIE = Number(employe.salaireBaseMensuel) || 0;
    let baseFMFPR = Number(employe.salaireBaseMensuel) || 0;
    let baseImposableIRSA_Gains = Number(employe.salaireBaseMensuel) || 0;
    let totalAvantagesNature = 0; // Pour déduction du net

    // Stocker les montants calculés pour la génération des lignes
    const variablesAvecMontant: Array<{
      variable: any;
      rubrique: any;
      montantCalcule: number;
    }> = [];

    for (const variable of variables) {
      const rubrique = rubriques.find((r) => r.uuid === variable.rubriqueUuid);
      if (!rubrique) continue;

      let montant = 0;
      const varMontant = Number(variable.montant) || 0;

      // Calcul du montant selon le mode de calcul de la rubrique
      if (rubrique.modeCalcul === 'FIXE') {
        montant = varMontant;
      } else if (rubrique.modeCalcul === 'TAUX_HORAIRE') {
        const tauxHoraire = (Number(employe.salaireBaseMensuel) || 0) / 173.33;
        const majoration = 1 + (Number(rubrique.pourcentageBase) || 0) / 100;
        montant = varMontant * tauxHoraire * majoration;
      } else if (rubrique.modeCalcul === 'POURCENTAGE_SALAIRE') {
        const base =
          (variable as any).basePersonnalisee ||
          Number(employe.salaireBaseMensuel) ||
          0;
        montant = (base * (Number(rubrique.pourcentageBase) || 0)) / 100;
      }

      // ✅ MODIFICATION : Gestion des bases spécifiques
      if (rubrique.inclusDansBrut === true) {
        salaireBrut += montant;
      } else {
        // Indemnités exonérées (sur justificatifs) → ajoutées directement au net
        totalExonere += montant;
      }

      if (rubrique.estCotisableCNaPS) baseCNaPS += montant;
      if (rubrique.estCotisableOSTIE) baseOSTIE += montant;
      if (rubrique.estCotisableFMFPR) baseFMFPR += montant;
      if (rubrique.estImposableIRSA) baseImposableIRSA_Gains += montant;

      if (rubrique.type === TypeRubrique.AVANTAGE_NATURE) {
        totalAvantagesNature += montant;
      }

      variablesAvecMontant.push({
        variable,
        rubrique,
        montantCalcule: montant,
      });
    }


    // 6. Calculer les cotisations sociales sur les bases spécifiques
    const cotisations =
      await this.cotisationService.calculerCotisationsSociales(
        salaireBrut,
        baseImposableIRSA_Gains,
        dateCalcul,
        {
          cnaps: baseCNaPS,
          ostie: baseOSTIE,
          fmfpr: baseFMFPR,
        },
      );

    // 7. Calculer l'IRSA
    const baseImposableIRSA = baseImposableIRSA_Gains - cotisations.totalSalarie;
    const resultatImpot = await this.barreIrsaService.calculerImpot(
      baseImposableIRSA,
      employe.nbEnfants,
      dateCalcul,
    );

    // 8. Calculer le net à payer
    // Net = (Salaire Brut - Cotisations - IRSA) + Indemnités Exonérées - Avantages en Nature
    const netAPayer =
      salaireBrut -
      cotisations.totalSalarie -
      resultatImpot.totalImpot +
      totalExonere -
      totalAvantagesNature;

    // 9. Créer ou mettre à jour le bulletin
    let bulletin = await this.bulletinRepository.findOne({
      where: { employeUuid, periodeUuid },
    });

    if (!bulletin) {
      bulletin = this.bulletinRepository.create({
        employeUuid,
        periodeUuid,
        dateEdition: new Date(),
      });
    }

    bulletin.salaireBrut = salaireBrut;
    bulletin.totalRetenues =
      cotisations.totalSalarie + resultatImpot.totalImpot;
    bulletin.totalCotisationsPatronales = cotisations.totalEmployeur;
    bulletin.netAPayer = netAPayer;
    bulletin.statut = StatutBulletin.CALCULE;

    await this.bulletinRepository.save(bulletin);

    // 10. Supprimer les anciennes lignes
    await this.ligneBulletinService.deleteByBulletin(bulletin.uuid);

    // 11. Générer toutes les lignes du bulletin

    // Ligne Salaire de base
    const salaireBaseRubrique = rubriques.find((r) => r.code === 'SAL_BASE');
    if (salaireBaseRubrique) {
      await this.ligneBulletinService.create({
        bulletinUuid: bulletin.uuid,
        rubriqueUuid: salaireBaseRubrique.uuid,
        base: 173.33,
        taux: null,
        montantSalarie: Number(employe.salaireBaseMensuel) || 0,
        montantEmployeur: null,
        reference: 'Salaire de base',
      });
    }

    // Lignes des variables (primes, indemnités, etc.)
    for (const item of variablesAvecMontant) {
      if (item.montantCalcule === 0) continue;

      await this.ligneBulletinService.create({
        bulletinUuid: bulletin.uuid,
        rubriqueUuid: item.rubrique.uuid,
        base: item.rubrique.modeCalcul === 'TAUX_HORAIRE' ? item.variable.montant : (item.variable.basePersonnalisee || null),
        taux: item.rubrique.pourcentageBase || null,
        montantSalarie: item.montantCalcule,
        montantEmployeur: null,
        reference: `${item.rubrique.libelle}${this.getAvantageInfo(item.rubrique)}`,
      });
    }

    // Lignes des cotisations (CNaPS, OSTIE, FMFPR)
    const cotisationRubriques = rubriques.filter(
      (r) => r.code === 'CNaPS' || r.code === 'OSTIE' || r.code === 'FMFPR',
    );

    for (const rubrique of cotisationRubriques) {
      let cotisationData;
      switch (rubrique.code) {
        case 'CNaPS':
          cotisationData = cotisations.cotisations.cnaps;
          break;
        case 'OSTIE':
          cotisationData = cotisations.cotisations.ostie;
          break;
        case 'FMFPR':
          cotisationData = cotisations.cotisations.fmfpr;
          break;
        default:
          continue;
      }

      await this.ligneBulletinService.create({
        bulletinUuid: bulletin.uuid,
        rubriqueUuid: rubrique.uuid,
        base: cotisationData.baseUtilisee,
        taux: rubrique.code === 'FMFPR' ? 0 : cotisationData.tauxSalarie,
        montantSalarie: cotisationData.montantSalarie,
        montantEmployeur: cotisationData.montantEmployeur,
        reference: `${rubrique.code} (${cotisationData.tauxSalarie}% employé / ${cotisationData.tauxEmployeur}% employeur)`,
      });
    }

    // Ligne IRSA
    const irsaRubrique = rubriques.find((r) => r.code === 'IRSA');
    if (irsaRubrique && resultatImpot.totalImpot > 0) {
      await this.ligneBulletinService.create({
        bulletinUuid: bulletin.uuid,
        rubriqueUuid: irsaRubrique.uuid,
        base: null,
        taux: null,
        montantSalarie: resultatImpot.totalImpot,
        montantEmployeur: null,
        reference: `Impôt (décote: ${resultatImpot.decote || 0} Ar, enfants: ${resultatImpot.enfants || 0})`,
      });
    }

    // 12. Sauvegarder le calcul IRSA
    await this.calculIrsaService.sauvegarderCalcul(
      bulletin.uuid,
      baseImposableIRSA,
      cotisations.totalSalarie,
      resultatImpot,
    );

    return this.findOne(bulletin.uuid);
  }

  /**
   * Calcule les bulletins pour tous les employés actifs sur une période
   */
  async calculerEnMasse(
    periodeUuid: string,
    date?: Date,
    employeUuids?: string[],
  ): Promise<BulletinPaieEntity[]> {
    // 1. Récupérer la période (vérification qu'elle n'est pas clôturée se fera dans calculerBulletin)
    await this.periodeService.findOne(periodeUuid);

    // 2. Récupérer tous les employés actifs
    const employes = await this.employeService.findAll();
    let employesActifs = employes.filter((e) => e.actif);

    if (employeUuids && employeUuids.length > 0) {
      employesActifs = employesActifs.filter((e) => employeUuids.includes(e.uuid));
    }

    if (employesActifs.length === 0) {
      throw new BadRequestException('Aucun employé actif trouvé pour le calcul');
    }

    const bulletins: BulletinPaieEntity[] = [];

    // 3. Calculer le bulletin pour chaque employé
    for (const employe of employesActifs) {
      try {
        const bulletin = await this.calculerBulletin(
          employe.uuid,
          periodeUuid,
          date,
        );
        bulletins.push(bulletin);
      } catch (error) {
        // Optionnel : on pourrait stocker les erreurs et continuer,
        // mais pour l'instant on laisse propager si c'est une erreur critique
        // ou on log et on passe au suivant.
        console.error(
          `Erreur lors du calcul du bulletin pour l'employé ${employe.matriculeInterne}:`,
          error,
        );
        // Si on veut s'arrêter à la première erreur, on throw.
        // throw error;
      }
    }

    return bulletins;
  }

  /**
   * Met à jour un bulletin
   */
  async update(
    uuid: string,
    updateDto: UpdateBulletinDto,
  ): Promise<BulletinPaieEntity> {
    const bulletin = await this.findOne(uuid);

    if (await this.periodeService.isClosed(bulletin.periodeUuid)) {
      throw new BadRequestException('La période est clôturée');
    }

    if (bulletin.statut === StatutBulletin.VALIDE) {
      throw new BadRequestException(
        'Impossible de modifier un bulletin validé',
      );
    }

    Object.assign(bulletin, updateDto);
    return this.bulletinRepository.save(bulletin);
  }

  /**
   * Valide un bulletin
   */
  async valider(uuid: string): Promise<BulletinPaieEntity> {
    const bulletin = await this.findOne(uuid);

    if (await this.periodeService.isClosed(bulletin.periodeUuid)) {
      throw new BadRequestException('La période est clôturée');
    }

    if (bulletin.statut === StatutBulletin.VALIDE || bulletin.statut === StatutBulletin.PAYE) {
      throw new BadRequestException('Ce bulletin est déjà validé ou payé');
    }

    if (bulletin.statut === StatutBulletin.ANNULE) {
      throw new BadRequestException('Impossible de valider un bulletin annulé');
    }

    bulletin.statut = StatutBulletin.VALIDE;
    return this.bulletinRepository.save(bulletin);
  }

  /**
   * Annule un bulletin
   */
  async annuler(uuid: string): Promise<BulletinPaieEntity> {
    const bulletin = await this.findOne(uuid);
    if (await this.periodeService.isClosed(bulletin.periodeUuid)) {
      throw new BadRequestException('La période est clôturée');
    }
    bulletin.statut = StatutBulletin.ANNULE;
    return this.bulletinRepository.save(bulletin);
  }

  /**
   * Marque un bulletin comme payé
   */
  async payer(uuid: string): Promise<BulletinPaieEntity> {
    const bulletin = await this.findOne(uuid);

    if (await this.periodeService.isClosed(bulletin.periodeUuid)) {
      throw new BadRequestException('La période est clôturée');
    }

    if (
      bulletin.statut !== StatutBulletin.VALIDE &&
      bulletin.statut !== StatutBulletin.GENERE
    ) {
      throw new BadRequestException(
        'Seul un bulletin validé ou généré peut être payé',
      );
    }

    bulletin.statut = StatutBulletin.PAYE;
    return this.bulletinRepository.save(bulletin);
  }

  /**
   * Supprime un bulletin
   */
  async remove(uuid: string): Promise<void> {
    const bulletin = await this.findOne(uuid);

    if (await this.periodeService.isClosed(bulletin.periodeUuid)) {
      throw new BadRequestException('La période est clôturée');
    }

    if (bulletin.statut === StatutBulletin.VALIDE) {
      throw new BadRequestException(
        'Impossible de supprimer un bulletin validé',
      );
    }

    await this.bulletinRepository.delete({ uuid });
  }

  /**
   * Retourne une chaîne d'information sur le statut de l'avantage
   */
  private getAvantageInfo(rubrique: any): string {
    if (rubrique.type !== TypeRubrique.AVANTAGE_NATURE) return '';

    const infos: string[] = [];
    if (rubrique.estImposableIRSA) infos.push('Imposable');
    else infos.push('Non imposable');

    const cotisable =
      rubrique.estCotisableCNaPS ||
      rubrique.estCotisableOSTIE ||
      rubrique.estCotisableFMFPR;
    if (cotisable) infos.push('Cotisable');
    else infos.push('Non cotisable');

    return " (" + infos.join(', ') + ")";
  }
}
