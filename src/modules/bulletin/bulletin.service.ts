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

    // 5. Calculer le salaire brut
    let salaireBrut = Number(employe.salaireBaseMensuel) || 0;

    for (const variable of variables) {
      const rubrique = rubriques.find((r) => r.uuid === variable.rubriqueUuid);
      if (!rubrique) continue;

      let montant = 0;
      const varMontant = Number(variable.montant) || 0;

      if (rubrique.modeCalcul === 'FIXE') {
        montant = varMontant;
      } else if (rubrique.modeCalcul === 'TAUX_HORAIRE') {
        const tauxHoraire = (Number(employe.salaireBaseMensuel) || 0) / 173.33;
        const majoration = 1 + (Number(rubrique.pourcentageBase) || 0) / 100;
        montant = varMontant * tauxHoraire * majoration;
      }

      if (
        rubrique.type === 'GAIN' ||
        rubrique.type === 'PRIME' ||
        rubrique.type === 'AVANTAGE_NATURE'
      ) {
        salaireBrut += montant;
      }
    }

    // 6. Calculer les cotisations sociales
    const cotisations =
      await this.cotisationService.calculerCotisationsSociales(
        salaireBrut,
        undefined,
        dateCalcul,
      );

    // 7. Calculer l'IRSA avec décote
    const baseImposable = salaireBrut - cotisations.totalSalarie;
    const resultatImpot = await this.barreIrsaService.calculerImpot(
      baseImposable,
      employe.nbEnfants,
      dateCalcul,
    );

    // 8. Calculer le net à payer
    const netAPayer = baseImposable - resultatImpot.totalImpot;

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

    // 10. Sauvegarder les lignes du bulletin
    await this.ligneBulletinService.genererLignes(
      bulletin.uuid,
      Number(employe.salaireBaseMensuel) || 0,
      salaireBrut,
      cotisations,
      resultatImpot,
    );

    // 10.b Sauvegarder les lignes des variables mensuelles (Primes, etc.)
    if (variables && variables.length > 0) {
      const tauxHoraire = (Number(employe.salaireBaseMensuel) || 0) / 173.33;
      await this.ligneBulletinService.genererLignesAVariables(
        bulletin.uuid,
        variables,
        rubriques,
        tauxHoraire,
      );
    }

    // 11. Sauvegarder le calcul IRSA
    await this.calculIrsaService.sauvegarderCalcul(
      bulletin.uuid,
      baseImposable,
      cotisations.totalSalarie,
      resultatImpot,
    );

    return this.findOne(bulletin.uuid);
  }

  /**
   * Met à jour un bulletin
   */
  async update(
    uuid: string,
    updateDto: UpdateBulletinDto,
  ): Promise<BulletinPaieEntity> {
    const bulletin = await this.findOne(uuid);

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

    if (bulletin.statut === StatutBulletin.VALIDE) {
      throw new BadRequestException('Ce bulletin est déjà validé');
    }

    bulletin.statut = StatutBulletin.VALIDE;
    return this.bulletinRepository.save(bulletin);
  }

  /**
   * Annule un bulletin
   */
  async annuler(uuid: string): Promise<BulletinPaieEntity> {
    const bulletin = await this.findOne(uuid);

    bulletin.statut = StatutBulletin.ANNULE;
    return this.bulletinRepository.save(bulletin);
  }

  /**
   * Supprime un bulletin
   */
  async remove(uuid: string): Promise<void> {
    const bulletin = await this.findOne(uuid);

    if (bulletin.statut === StatutBulletin.VALIDE) {
      throw new BadRequestException(
        'Impossible de supprimer un bulletin validé',
      );
    }

    await this.bulletinRepository.delete({ uuid });
  }
}
