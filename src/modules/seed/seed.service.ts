import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RubriqueEntity,
  TypeRubrique,
  ModeCalcul,
  SensRubrique,
} from '../rubrique/entities/rubrique.entity';
import {
  CotisationEntity,
  TypeBaseCotisation,
} from '../cotisation/entities/cotisation.entity';
import { BarreIrsaEntity } from '../barre-irsa/entities/barre-irsa.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(RubriqueEntity)
    private readonly rubriqueRepository: Repository<RubriqueEntity>,
    @InjectRepository(CotisationEntity)
    private readonly cotisationRepository: Repository<CotisationEntity>,
    @InjectRepository(BarreIrsaEntity)
    private readonly barreIrsaRepository: Repository<BarreIrsaEntity>,
  ) {}

  async seedDefaultData() {
    this.logger.log('🚀 Starting data seeding...');
    const rubriques = await this.seedRubriques();
    const cotisations = await this.seedCotisations();
    const barreIrsa = await this.seedBarreIrsa();

    this.logger.log(
      `✅ Seeding completed: ${rubriques.length} rubriques, ${cotisations.length} cotisations, ${barreIrsa.length} barèmes`,
    );

    return {
      message: 'Initialisation terminée avec succès',
      summary: {
        rubriques: rubriques.length,
        cotisations: cotisations.length,
        barreIrsa: barreIrsa.length,
      },
    };
  }

  public async seedRubriques() {
    const defaults = [
      // ==================== SALAIRE DE BASE ====================
      {
        code: 'SAL_BASE',
        libelle: 'Salaire de base',
        description: 'Salaire contractuel mensuel',
        type: TypeRubrique.GAIN,
        modeCalcul: ModeCalcul.FIXE,
        valeurFixe: null,
        pourcentageBase: null,
        ordreAffichage: 1,
        estImposableIRSA: true,
        estCotisableCNaPS: true,
        estCotisableOSTIE: true,
        estCotisableFMFPR: true,
        inclusDansBrut: true,
        sens: SensRubrique.POSITIF,
        actif: true,
      },

      // ==================== HEURES SUPPLÉMENTAIRES ====================
      {
        code: 'HEURE130',
        libelle: 'Heures supplémentaires 130%',
        description: 'Heures supplémentaires majorées à 30% (41h-48h)',
        type: TypeRubrique.GAIN,
        modeCalcul: ModeCalcul.TAUX_HORAIRE,
        valeurFixe: null,
        pourcentageBase: 30,
        ordreAffichage: 2,
        estImposableIRSA: true,
        estCotisableCNaPS: true,
        estCotisableOSTIE: true,
        estCotisableFMFPR: true,
        inclusDansBrut: true,
        sens: SensRubrique.POSITIF,
        actif: true,
      },
      {
        code: 'HEURE150',
        libelle: 'Heures supplémentaires 150%',
        description: 'Heures supplémentaires majorées à 50% (>48h)',
        type: TypeRubrique.GAIN,
        modeCalcul: ModeCalcul.TAUX_HORAIRE,
        valeurFixe: null,
        pourcentageBase: 50,
        ordreAffichage: 3,
        estImposableIRSA: true,
        estCotisableCNaPS: true,
        estCotisableOSTIE: true,
        estCotisableFMFPR: true,
        inclusDansBrut: true,
        sens: SensRubrique.POSITIF,
        actif: true,
      },

      // ==================== COTISATIONS ====================
      {
        code: 'CNaPS',
        libelle: 'CNaPS',
        description: 'Caisse Nationale de Prévoyance Sociale',
        type: TypeRubrique.RETENUE,
        modeCalcul: ModeCalcul.POURCENTAGE_SALAIRE,
        valeurFixe: null,
        pourcentageBase: 1,
        ordreAffichage: 10,
        estImposableIRSA: false,
        estCotisableCNaPS: false,
        estCotisableOSTIE: false,
        estCotisableFMFPR: false,
        inclusDansBrut: false,
        sens: SensRubrique.NEGATIF,
        actif: true,
      },
      {
        code: 'OSTIE',
        libelle: 'OSTIE',
        description:
          "Organisme de Soutien Technique à l'Insertion et à l'Emploi",
        type: TypeRubrique.RETENUE,
        modeCalcul: ModeCalcul.POURCENTAGE_SALAIRE,
        valeurFixe: null,
        pourcentageBase: 1,
        ordreAffichage: 11,
        estImposableIRSA: false,
        estCotisableCNaPS: false,
        estCotisableOSTIE: false,
        estCotisableFMFPR: false,
        inclusDansBrut: false,
        sens: SensRubrique.NEGATIF,
        actif: true,
      },
      {
        code: 'FMFPR',
        libelle: 'FMFPR',
        description: 'Fonds de Médiation et de Formation Professionnelle',
        type: TypeRubrique.RETENUE,
        modeCalcul: ModeCalcul.POURCENTAGE_SALAIRE,
        valeurFixe: null,
        pourcentageBase: 0,
        ordreAffichage: 12,
        estImposableIRSA: false,
        estCotisableCNaPS: false,
        estCotisableOSTIE: false,
        estCotisableFMFPR: false,
        inclusDansBrut: false,
        sens: SensRubrique.NEGATIF,
        actif: true,
      },

      // ==================== IMPÔT ====================
      {
        code: 'IRSA',
        libelle: 'IRSA',
        description: 'Impôt sur le Revenu des Salaires et Assimilés',
        type: TypeRubrique.RETENUE,
        modeCalcul: ModeCalcul.FIXE,
        valeurFixe: null,
        pourcentageBase: null,
        ordreAffichage: 20,
        estImposableIRSA: false,
        estCotisableCNaPS: false,
        estCotisableOSTIE: false,
        estCotisableFMFPR: false,
        inclusDansBrut: false,
        sens: SensRubrique.NEGATIF,
        actif: true,
      },
    ];

    const results: RubriqueEntity[] = [];
    for (const data of defaults) {
      const exists = await this.rubriqueRepository.findOne({
        where: { code: data.code },
      });
      if (!exists) {
        const created = this.rubriqueRepository.create(data);
        results.push(await this.rubriqueRepository.save(created));
        this.logger.log(`✅ Rubrique créée: ${data.code}`);
      } else {
        this.logger.log(`⏭️ Rubrique déjà existante: ${data.code}`);
      }
    }
    return results;
  }

  public async seedCotisations() {
    const defaults = [
      {
        code: 'CNaPS',
        libelle: 'Caisse Nationale de Prévoyance Sociale',
        tauxSalarie: 1.0,
        tauxEmployeur: 13.0,
        plafond: 2400000,
        typeBase: TypeBaseCotisation.PLAFONNE,
        actif: true,
        dateDebut: new Date('2024-01-01'),
        dateFin: null,
      },
      {
        code: 'OSTIE',
        libelle: "Organisme de Soutien Technique à l'Insertion et à l'Emploi",
        tauxSalarie: 1.0,
        tauxEmployeur: 5.0,
        plafond: null,
        typeBase: TypeBaseCotisation.BRUT_TOTAL,
        actif: true,
        dateDebut: new Date('2024-01-01'),
        dateFin: null,
      },
      {
        code: 'FMFPR',
        libelle: 'Fonds de Médiation et de Formation Professionnelle',
        tauxSalarie: 0.0,
        tauxEmployeur: 1.0,
        plafond: null,
        typeBase: TypeBaseCotisation.BRUT_TOTAL,
        actif: true,
        dateDebut: new Date('2024-01-01'),
        dateFin: null,
      },
    ];

    const results: CotisationEntity[] = [];
    for (const data of defaults) {
      const exists = await this.cotisationRepository.findOne({
        where: { code: data.code },
      });
      if (!exists) {
        const created = this.cotisationRepository.create(data);
        results.push(await this.cotisationRepository.save(created));
        this.logger.log(`✅ Cotisation créée: ${data.code}`);
      } else {
        this.logger.log(`⏭️ Cotisation déjà existante: ${data.code}`);
      }
    }
    return results;
  }

  public async seedBarreIrsa() {
    const defaults = [
      {
        trancheMin: 0,
        trancheMax: 350000,
        taux: 0,
        ordre: 1,
        dateDebut: new Date('2024-01-01'),
        dateFin: null,
      },
      {
        trancheMin: 350001,
        trancheMax: 400000,
        taux: 5,
        ordre: 2,
        dateDebut: new Date('2024-01-01'),
        dateFin: null,
      },
      {
        trancheMin: 400001,
        trancheMax: 500000,
        taux: 10,
        ordre: 3,
        dateDebut: new Date('2024-01-01'),
        dateFin: null,
      },
      {
        trancheMin: 500001,
        trancheMax: 600000,
        taux: 15,
        ordre: 4,
        dateDebut: new Date('2024-01-01'),
        dateFin: null,
      },
      {
        trancheMin: 600001,
        trancheMax: null,
        taux: 20,
        ordre: 5,
        dateDebut: new Date('2024-01-01'),
        dateFin: null,
      },
    ];

    const results: BarreIrsaEntity[] = [];
    const count = await this.barreIrsaRepository.count();

    if (count === 0) {
      for (const data of defaults) {
        const created = this.barreIrsaRepository.create(data);
        results.push(await this.barreIrsaRepository.save(created));
        this.logger.log(`✅ Barème IRSA créé: tranche ${data.ordre}`);
      }
    } else {
      this.logger.log(
        `⏭️ Barème IRSA déjà existant (${count} tranches trouvées)`,
      );
    }

    return results;
  }
}
