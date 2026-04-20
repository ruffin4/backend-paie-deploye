/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LigneBulletinEntity } from './entities/ligne-bulletin.entity';
import { CreateLigneBulletinDto } from './dto/create-ligne-bulletin.dto';
import { UpdateLigneBulletinDto } from './dto/update-ligne-bulletin.dto';
import { RubriqueService } from '../rubrique/rubrique.service';

export interface LigneBulletinData {
  rubriqueUuid: string;
  base: number | null;
  taux: number | null;
  montantSalarie: number;
  montantEmployeur: number | null;
  reference?: string;
}

export interface CotisationsResult {
  cotisations: {
    cnaps: {
      montantSalarie: number;
      montantEmployeur: number;
      baseUtilisee: number;
      tauxSalarie: number;
      tauxEmployeur: number;
    };
    ostie: {
      montantSalarie: number;
      montantEmployeur: number;
      baseUtilisee: number;
      tauxSalarie: number;
      tauxEmployeur: number;
    };
    fmfpr: {
      montantSalarie: number;
      montantEmployeur: number;
      baseUtilisee: number;
      tauxSalarie: number;
      tauxEmployeur: number;
    };
  };
  totalSalarie: number;
  totalEmployeur: number;
}

export interface ResultatImpot {
  totalImpot: number;
  decote?: number;
  enfants?: number;
  details?: Array<{
    trancheMin: number;
    trancheMax: number | null;
    taux: number;
    montantTranche: number;
    impotTranche: number;
  }>;
}

@Injectable()
export class LigneBulletinService {
  constructor(
    @InjectRepository(LigneBulletinEntity)
    private readonly ligneRepository: Repository<LigneBulletinEntity>,
    private readonly rubriqueService: RubriqueService,
  ) {}

  async create(
    createDto: CreateLigneBulletinDto,
  ): Promise<LigneBulletinEntity> {
    // Vérifier que la rubrique existe
    await this.rubriqueService.findOne(createDto.rubriqueUuid);

    const ligne = this.ligneRepository.create(createDto);
    return this.ligneRepository.save(ligne);
  }

  async createMany(
    lignesData: LigneBulletinData[],
    bulletinUuid: string,
  ): Promise<LigneBulletinEntity[]> {
    const lignes = lignesData.map((data) =>
      this.ligneRepository.create({
        ...data,
        bulletinUuid,
      }),
    );
    return this.ligneRepository.save(lignes);
  }

  async findAll(): Promise<LigneBulletinEntity[]> {
    return this.ligneRepository.find({
      relations: ['rubrique'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByBulletin(bulletinUuid: string): Promise<LigneBulletinEntity[]> {
    return this.ligneRepository.find({
      where: { bulletinUuid },
      relations: ['rubrique'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByRubrique(rubriqueUuid: string): Promise<LigneBulletinEntity[]> {
    return this.ligneRepository.find({
      where: { rubriqueUuid },
      relations: ['bulletin'],
    });
  }

  async findOne(uuid: string): Promise<LigneBulletinEntity> {
    const ligne = await this.ligneRepository.findOne({
      where: { uuid },
      relations: ['rubrique', 'bulletin'],
    });
    if (!ligne) {
      throw new NotFoundException(
        `Ligne de bulletin avec l'UUID "${uuid}" non trouvée`,
      );
    }
    return ligne;
  }

  async update(
    uuid: string,
    updateDto: UpdateLigneBulletinDto,
  ): Promise<LigneBulletinEntity> {
    const ligne = await this.findOne(uuid);
    Object.assign(ligne, updateDto);
    return this.ligneRepository.save(ligne);
  }

  async remove(uuid: string): Promise<void> {
    const result = await this.ligneRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Ligne de bulletin avec l'UUID "${uuid}" non trouvée`,
      );
    }
  }

  async deleteByBulletin(bulletinUuid: string): Promise<void> {
    await this.ligneRepository.delete({ bulletinUuid });
  }

  async getTotalGains(bulletinUuid: string): Promise<number> {
    const lignes = await this.ligneRepository.find({
      where: { bulletinUuid },
      relations: ['rubrique'],
    });

    return lignes
      .filter((l) => l.rubrique.type === 'GAIN' || l.rubrique.type === 'PRIME')
      .reduce((sum, l) => sum + l.montantSalarie, 0);
  }

  async getTotalRetenues(bulletinUuid: string): Promise<number> {
    const lignes = await this.ligneRepository.find({
      where: { bulletinUuid },
      relations: ['rubrique'],
    });

    return lignes
      .filter((l) => l.rubrique.type === 'RETENUE')
      .reduce((sum, l) => sum + l.montantSalarie, 0);
  }

  async getTotalCotisationsPatronales(bulletinUuid: string): Promise<number> {
    const lignes = await this.ligneRepository.find({
      where: { bulletinUuid },
    });

    return lignes.reduce((sum, l) => sum + (l.montantEmployeur || 0), 0);
  }

  /**
   * Génère automatiquement toutes les lignes d'un bulletin à partir des calculs
   * @param bulletinUuid UUID du bulletin
   * @param salaireBase Salaire de base
   * @param salaireBrut Salaire brut total
   * @param cotisations Résultat du calcul des cotisations
   * @param resultatImpot Résultat du calcul de l'impôt
   * @param rubriques Liste des rubriques (optionnel)
   */
  async genererLignes(
    bulletinUuid: string,
    salaireBase: number,
    salaireBrut: number,
    cotisations: CotisationsResult,
    resultatImpot: ResultatImpot,
    rubriques?: any[],
  ): Promise<LigneBulletinEntity[]> {
    // Supprimer les anciennes lignes
    await this.deleteByBulletin(bulletinUuid);

    // Récupérer les rubriques si non fournies
    let allRubriques = rubriques;
    if (!allRubriques) {
      allRubriques = await this.rubriqueService.findAll();
    }

    const lignes: LigneBulletinData[] = [];

    // 1. Ligne Salaire de base
    const salaireBaseRubrique = allRubriques.find((r) => r.code === 'SAL_BASE');
    if (salaireBaseRubrique) {
      lignes.push({
        rubriqueUuid: salaireBaseRubrique.uuid,
        base: null,
        taux: null,
        montantSalarie: salaireBase,
        montantEmployeur: null,
        reference: 'Salaire de base',
      });
    }

    // 2. Lignes des cotisations (CNaPS, OSTIE, FMFPR)
    const cotisationRubriques = allRubriques.filter(
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

      if (
        cotisationData.montantSalarie > 0 ||
        cotisationData.montantEmployeur > 0
      ) {
        lignes.push({
          rubriqueUuid: rubrique.uuid,
          base: cotisationData.baseUtilisee,
          taux: rubrique.code === 'FMFPR' ? 0 : cotisationData.tauxSalarie,
          montantSalarie: cotisationData.montantSalarie,
          montantEmployeur: cotisationData.montantEmployeur,
          reference: `${rubrique.code} (${cotisationData.tauxSalarie}% employé / ${cotisationData.tauxEmployeur}% employeur)`,
        });
      }
    }

    // 3. Ligne IRSA
    const irsaRubrique = allRubriques.find((r) => r.code === 'IRSA');
    if (irsaRubrique && resultatImpot.totalImpot > 0) {
      lignes.push({
        rubriqueUuid: irsaRubrique.uuid,
        base: null,
        taux: null,
        montantSalarie: resultatImpot.totalImpot,
        montantEmployeur: null,
        reference: `Impôt (décote: ${resultatImpot.decote || 0} Ar, enfants: ${resultatImpot.enfants || 0})`,
      });
    }

    return this.createMany(lignes, bulletinUuid);
  }

  /**
   * Génère les lignes de bulletin à partir des variables mensuelles
   * @param bulletinUuid UUID du bulletin
   * @param variables Variables mensuelles de l'employé
   * @param rubriques Liste des rubriques
   * @param tauxHoraire Taux horaire de l'employé
   */
  async genererLignesAVariables(
    bulletinUuid: string,
    variables: Array<{
      rubriqueUuid: string;
      montant: number;
      basePersonnalisee?: number | null;
    }>,
    rubriques: any[],
    tauxHoraire: number,
  ): Promise<LigneBulletinEntity[]> {
    const lignes: LigneBulletinData[] = [];

    for (const variable of variables) {
      const rubrique = rubriques.find((r) => r.uuid === variable.rubriqueUuid);
      if (!rubrique) continue;

      let montant = 0;
      let base: number | null = null;
      let taux: number | null = null;

      if (rubrique.modeCalcul === 'FIXE') {
        montant = variable.montant;
      } else if (rubrique.modeCalcul === 'TAUX_HORAIRE') {
        const majoration = 1 + (rubrique.pourcentageBase || 0) / 100;
        montant = variable.montant * tauxHoraire * majoration;
        base = variable.montant;
        taux = tauxHoraire;
      } else if (rubrique.modeCalcul === 'POURCENTAGE_SALAIRE') {
        const baseCalcul = variable.basePersonnalisee || tauxHoraire * 173.33;
        montant = (baseCalcul * (rubrique.pourcentageBase || 0)) / 100;
        base = baseCalcul;
        taux = rubrique.pourcentageBase;
      }

      if (montant > 0) {
        lignes.push({
          rubriqueUuid: rubrique.uuid,
          base: base,
          taux: taux,
          montantSalarie: montant,
          montantEmployeur: null,
          reference: `${rubrique.libelle}`,
        });
      }
    }

    return this.createMany(lignes, bulletinUuid);
  }
}
