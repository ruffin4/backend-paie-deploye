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
    this.logger.log('Starting data seeding...');
    const rubriques = await this.seedRubriques();
    const cotisations = await this.seedCotisations();
    const barreIrsa = await this.seedBarreIrsa();

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
      {
        code: 'SAL_BASE',
        libelle: 'Salaire de base',
        type: TypeRubrique.GAIN,
        modeCalcul: ModeCalcul.FIXE,
        ordreAffichage: 10,
        estImposableIRSA: true,
        estCotisableCNaPS: true,
        estCotisableOSTIE: true,
        estCotisableFMFPR: true,
        inclusDansBrut: true,
      },
      {
        code: 'HEURE130',
        libelle: 'Heures supplémentaires 130%',
        type: TypeRubrique.GAIN,
        modeCalcul: ModeCalcul.TAUX_HORAIRE,
        pourcentageBase: 130,
        ordreAffichage: 20,
        estImposableIRSA: true,
        estCotisableCNaPS: true,
        estCotisableOSTIE: true,
        estCotisableFMFPR: true,
        inclusDansBrut: true,
      },
      {
        code: 'HEURE150',
        libelle: 'Heures supplémentaires 150%',
        type: TypeRubrique.GAIN,
        modeCalcul: ModeCalcul.TAUX_HORAIRE,
        pourcentageBase: 150,
        ordreAffichage: 21,
        estImposableIRSA: true,
        estCotisableCNaPS: true,
        estCotisableOSTIE: true,
        estCotisableFMFPR: true,
        inclusDansBrut: true,
      },
      {
        code: 'CNAPS',
        libelle: 'CNaPS',
        type: TypeRubrique.RETENUE,
        modeCalcul: ModeCalcul.POURCENTAGE_SALAIRE,
        ordreAffichage: 100,
        estImposableIRSA: false,
        estCotisableCNaPS: false,
        estCotisableOSTIE: false,
        estCotisableFMFPR: false,
        inclusDansBrut: false,
        sens: SensRubrique.NEGATIF,
      },
      {
        code: 'OSTIE',
        libelle: 'OSTIE',
        type: TypeRubrique.RETENUE,
        modeCalcul: ModeCalcul.POURCENTAGE_SALAIRE,
        ordreAffichage: 101,
        estImposableIRSA: false,
        estCotisableCNaPS: false,
        estCotisableOSTIE: false,
        estCotisableFMFPR: false,
        inclusDansBrut: false,
        sens: SensRubrique.NEGATIF,
      },
      {
        code: 'IRSA',
        libelle: 'IRSA',
        type: TypeRubrique.RETENUE,
        modeCalcul: ModeCalcul.FIXE,
        ordreAffichage: 110,
        estImposableIRSA: false,
        estCotisableCNaPS: false,
        estCotisableOSTIE: false,
        estCotisableFMFPR: false,
        inclusDansBrut: false,
        sens: SensRubrique.NEGATIF,
      },
      {
        code: 'FMFPR',
        libelle: 'FMFPR',
        type: TypeRubrique.RETENUE,
        modeCalcul: ModeCalcul.POURCENTAGE_SALAIRE,
        ordreAffichage: 120,
        estImposableIRSA: false,
        estCotisableCNaPS: false,
        estCotisableOSTIE: false,
        estCotisableFMFPR: false,
        inclusDansBrut: false,
        sens: SensRubrique.NEGATIF,
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
      }
    }
    return results;
  }

  public async seedCotisations() {
    const defaults = [
      {
        code: 'CNAPS',
        libelle: 'CNaPS',
        tauxSalarie: 1,
        tauxEmployeur: 13,
        typeBase: TypeBaseCotisation.PLAFONNE,
        plafond: 2400000,
        dateDebut: new Date('2024-01-01'),
      },
      {
        code: 'OSTIE',
        libelle: 'OSTIE',
        tauxSalarie: 1,
        tauxEmployeur: 5,
        typeBase: TypeBaseCotisation.PLAFONNE,
        plafond: 2400000,
        dateDebut: new Date('2024-01-01'),
      },
      {
        code: 'FMFPR',
        libelle: 'FMFPR',
        tauxSalarie: 0,
        tauxEmployeur: 1,
        typeBase: TypeBaseCotisation.PLAFONNE,
        plafond: 2400000,
        dateDebut: new Date('2024-01-01'),
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
      },
      {
        trancheMin: 350001,
        trancheMax: 400000,
        taux: 5,
        ordre: 2,
        dateDebut: new Date('2024-01-01'),
      },
      {
        trancheMin: 400001,
        trancheMax: 500000,
        taux: 10,
        ordre: 3,
        dateDebut: new Date('2024-01-01'),
      },
      {
        trancheMin: 500001,
        trancheMax: 600000,
        taux: 15,
        ordre: 4,
        dateDebut: new Date('2024-01-01'),
      },
      {
        trancheMin: 600001,
        trancheMax: null,
        taux: 20,
        ordre: 5,
        dateDebut: new Date('2024-01-01'),
      },
    ];

    const results: BarreIrsaEntity[] = [];
    const count = await this.barreIrsaRepository.count();
    if (count === 0) {
      for (const data of defaults) {
        const created = this.barreIrsaRepository.create(data);
        results.push(await this.barreIrsaRepository.save(created));
      }
    }
    return results;
  }
}
