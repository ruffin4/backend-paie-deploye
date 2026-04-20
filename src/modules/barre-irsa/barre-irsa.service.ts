import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { BarreIrsaEntity } from './entities/barre-irsa.entity';
import { CreateBarreIrsaDto } from './dto/create-barre-irsa.dto';
import { UpdateBarreIrsaDto } from './dto/update-barre-irsa.dto';
import { CotisationService } from '../cotisation/cotisation.service';
import { EmployeService } from '../employe/employe.service';

export interface DetailImpot {
  trancheUuid: string;
  trancheMin: number;
  trancheMax: number | null;
  taux: number;
  montantTranche: number;
  impotTranche: number;
}

export interface ResultatCalculImpot {
  totalImpot: number;
  details?: DetailImpot[];
  totalImpotApresDecote?: number;
  decote?: number;
  montantMinimal?: number;
  enfants?: number;
}

export interface CotisationInfo {
  code: string;
  tauxSalarie: number;
  actif: boolean;
  dateDebut: Date;
  dateFin: Date | null;
}

export interface AbattementInfo {
  taux: number;
  plafond: number | null;
  baseCotisations: number;
  montantAbattement: number;
  details?: CotisationInfo[];
}

@Injectable()
export class BarreIrsaService {
  constructor(
    @InjectRepository(BarreIrsaEntity)
    private readonly barreIrsaRepository: Repository<BarreIrsaEntity>,
    @Inject(forwardRef(() => CotisationService))
    private readonly cotisationService: CotisationService,
    private readonly employeService: EmployeService,
  ) {}

  async create(createDto: CreateBarreIrsaDto): Promise<BarreIrsaEntity> {
    const existingTranche = await this.barreIrsaRepository.findOne({
      where: {
        ordre: createDto.ordre,
        dateDebut: new Date(createDto.dateDebut),
      },
    });

    if (existingTranche) {
      throw new ConflictException(
        `Une tranche avec l'ordre ${createDto.ordre} existe déjà pour cette période`,
      );
    }

    const barre = this.barreIrsaRepository.create({
      ...createDto,
      dateDebut: new Date(createDto.dateDebut),
      dateFin: createDto.dateFin ? new Date(createDto.dateFin) : null,
    });

    return this.barreIrsaRepository.save(barre);
  }

  async findAll(): Promise<BarreIrsaEntity[]> {
    return this.barreIrsaRepository.find({
      order: { dateDebut: 'DESC', ordre: 'ASC' },
    });
  }

  async findActive(): Promise<BarreIrsaEntity[]> {
    const now = new Date();
    return this.barreIrsaRepository.find({
      where: {
        dateDebut: LessThan(now),
        dateFin: MoreThan(now),
      },
      order: { ordre: 'ASC' },
    });
  }

  async findOne(uuid: string): Promise<BarreIrsaEntity> {
    const barre = await this.barreIrsaRepository.findOne({ where: { uuid } });
    if (!barre) {
      throw new NotFoundException(
        `Tranche IRSA avec l'UUID "${uuid}" non trouvée`,
      );
    }
    return barre;
  }

  async update(
    uuid: string,
    updateDto: UpdateBarreIrsaDto,
  ): Promise<BarreIrsaEntity> {
    const barre = await this.findOne(uuid);

    if (updateDto.dateDebut) {
      barre.dateDebut = new Date(updateDto.dateDebut);
    }
    if (updateDto.dateFin !== undefined) {
      barre.dateFin = updateDto.dateFin ? new Date(updateDto.dateFin) : null;
    }
    if (updateDto.trancheMin !== undefined) {
      barre.trancheMin = updateDto.trancheMin;
    }
    if (updateDto.trancheMax !== undefined) {
      barre.trancheMax = updateDto.trancheMax;
    }
    if (updateDto.taux !== undefined) {
      barre.taux = updateDto.taux;
    }
    if (updateDto.ordre !== undefined) {
      barre.ordre = updateDto.ordre;
    }

    return this.barreIrsaRepository.save(barre);
  }

  async remove(uuid: string): Promise<void> {
    const result = await this.barreIrsaRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Tranche IRSA avec l'UUID "${uuid}" non trouvée`,
      );
    }
  }

  async getActiveBarreForDate(date: Date): Promise<BarreIrsaEntity[]> {
    return this.barreIrsaRepository.find({
      where: {
        dateDebut: LessThan(date),
        dateFin: MoreThan(date),
      },
      order: { ordre: 'ASC' },
    });
  }

  /**
   * Calcule la décote pour enfants à charge
   * Règle:
   * - Décote de 2000 Ar par enfant à charge
   * - L'impôt ne peut pas être inférieur à 2000 Ar
   * @param impotBrut Impôt calculé avant décote
   * @param nbEnfants Nombre d'enfants à charge
   */
  calculerImpotAvecDecote(
    impotBrut: number,
    nbEnfants: number,
  ): {
    impotFinal: number;
    decote: number;
    montantMinimal: number;
  } {
    const DECOTE_PAR_ENFANT = 2000;
    const MONTANT_MINIMAL = 2000;

    // Calcul de la décote
    const decote = nbEnfants * DECOTE_PAR_ENFANT;

    // Application de la décote
    let impotFinal = impotBrut - decote;

    // Si l'impôt devient négatif, on le ramène à 0
    if (impotFinal < 0) {
      impotFinal = 0;
    }

    // Vérification du montant minimal (2000 Ar)
    if (impotFinal < MONTANT_MINIMAL && impotFinal > 0) {
      impotFinal = MONTANT_MINIMAL;
    }

    return {
      impotFinal,
      decote,
      montantMinimal: MONTANT_MINIMAL,
    };
  }

  /**
   * Calcule l'impôt à partir de la base imposable
   */
  async calculerImpot(
    baseImposable: number,
    nbEnfants: number = 0,
    date: Date = new Date(),
  ): Promise<ResultatCalculImpot> {
    const barre = await this.getActiveBarreForDate(date);

    if (barre.length === 0) {
      throw new BadRequestException(
        'Aucun barème IRSA actif trouvé pour cette date',
      );
    }

    let reste = baseImposable;
    const details: DetailImpot[] = [];
    let totalImpot = 0;

    for (let i = 0; i < barre.length; i++) {
      const tranche = barre[i];
      const trancheMin = tranche.trancheMin;
      const trancheMax = tranche.trancheMax;
      const taux = tranche.taux;

      let montantTranche = 0;

      if (trancheMax !== null) {
        const etendue = trancheMax - trancheMin;
        if (reste > etendue) {
          montantTranche = etendue;
        } else {
          montantTranche = reste;
        }
      } else {
        montantTranche = reste;
      }

      if (montantTranche > 0) {
        const impotTranche = Math.round((montantTranche * taux) / 100);

        details.push({
          trancheUuid: tranche.uuid,
          trancheMin: trancheMin,
          trancheMax: trancheMax,
          taux: taux,
          montantTranche: montantTranche,
          impotTranche: impotTranche,
        });

        totalImpot += impotTranche;
        reste -= montantTranche;
      }

      if (reste <= 0) break;
    }

    // Appliquer la décote pour enfants
    const { impotFinal, decote, montantMinimal } = this.calculerImpotAvecDecote(
      totalImpot,
      nbEnfants,
    );

    return {
      totalImpot: impotFinal,
      details,
      totalImpotApresDecote: impotFinal,
      decote,
      montantMinimal,
      enfants: nbEnfants,
    };
  }

  /**
   * Récupère les cotisations actives depuis la table cotisations_legales
   * @param date Date de calcul
   * @returns Liste des cotisations actives (CNaPS, OSTIE, etc.)
   */
  async getCotisationsActives(
    date: Date = new Date(),
  ): Promise<CotisationInfo[]> {
    try {
      const cotisations = await this.cotisationService.findAll();

      const actives = cotisations.filter((c) => {
        const dateDebut = new Date(c.dateDebut);
        const dateFin = c.dateFin ? new Date(c.dateFin) : null;
        const isActive =
          c.actif === true &&
          dateDebut <= date &&
          (dateFin === null || dateFin >= date);

        return isActive && (c.code === 'CNaPS' || c.code === 'OSTIE');
      });

      if (actives.length === 0) {
        console.warn('⚠️ Aucune cotisation CNaPS/OSTIE trouvée');
        return [];
      }

      return actives.map((c) => ({
        code: c.code,
        tauxSalarie:
          typeof c.tauxSalarie === 'string'
            ? parseFloat(c.tauxSalarie)
            : c.tauxSalarie,
        actif: c.actif,
        dateDebut: c.dateDebut,
        dateFin: c.dateFin,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des cotisations:', error);
      return [];
    }
  }

  /**
   * Calcule l'abattement dynamique à partir des cotisations sociales
   * @param brutTotal Salaire brut total
   * @param plafondSME Plafond pour l'abattement (SME)
   * @param date Date de calcul
   */
  async calculerAbattementDynamique(
    brutTotal: number,
    plafondSME: number,
    date: Date = new Date(),
  ): Promise<AbattementInfo> {
    // 1. Récupérer les cotisations actives depuis la base
    let cotisations = await this.getCotisationsActives(date);

    // 2. Fallback si aucune cotisation trouvée
    if (cotisations.length === 0) {
      console.warn(
        '⚠️ Utilisation des valeurs par défaut (CNaPS 1%, OSTIE 1%)',
      );
      cotisations = [
        {
          code: 'CNaPS',
          tauxSalarie: 1.0,
          actif: true,
          dateDebut: new Date('2024-01-01'),
          dateFin: null,
        },
        {
          code: 'OSTIE',
          tauxSalarie: 1.0,
          actif: true,
          dateDebut: new Date('2024-01-01'),
          dateFin: null,
        },
      ];
    }

    // 3. Calculer le taux total d'abattement
    let tauxTotal = 0;
    const details: CotisationInfo[] = [];

    for (const cotisation of cotisations) {
      const taux =
        typeof cotisation.tauxSalarie === 'number'
          ? cotisation.tauxSalarie
          : parseFloat(String(cotisation.tauxSalarie));

      if (!isNaN(taux)) {
        tauxTotal += taux;
        details.push({
          ...cotisation,
          tauxSalarie: taux,
        });
      }
    }

    // 4. Base pour le calcul des cotisations = min(brutTotal, plafondSME)
    const baseCotisations = Math.min(brutTotal, plafondSME);

    // 5. Montant de l'abattement
    const montantAbattement = Math.round(baseCotisations * (tauxTotal / 100));

    return {
      taux: tauxTotal,
      plafond: plafondSME,
      baseCotisations,
      montantAbattement,
      details,
    };
  }

  /**
   * Calcule la base imposable à partir du salaire brut (dynamique)
   * @param brutTotal Salaire brut total
   * @param plafondSME Plafond pour l'abattement (défaut: 2 400 000)
   * @param date Date de calcul
   */
  async calculerBaseImposableDynamique(
    brutTotal: number,
    plafondSME: number = 2_400_000,
    date: Date = new Date(),
  ): Promise<{
    brutTotal: number;
    plafondSME: number;
    abattementInfo: AbattementInfo;
    baseImposable: number;
  }> {
    const abattementInfo = await this.calculerAbattementDynamique(
      brutTotal,
      plafondSME,
      date,
    );

    const montantAbattement = abattementInfo.montantAbattement || 0;
    const baseImposable = Math.max(
      0,
      Math.round(brutTotal - montantAbattement),
    );

    return {
      brutTotal,
      plafondSME,
      abattementInfo,
      baseImposable,
    };
  }

  /**
   * Calcule l'impôt à partir du salaire brut (version dynamique avec employé)
   * @param brutTotal Salaire brut total
   * @param employeUuid UUID de l'employé (pour récupérer le nombre d'enfants)
   * @param plafondSME Plafond pour l'abattement
   * @param date Date de calcul
   */
  async calculerImpotDepuisBrutDynamique(
    brutTotal: number,
    employeUuid: string,
    plafondSME: number = 2_400_000,
    date: Date = new Date(),
  ): Promise<{
    brutTotal: number;
    plafondSME: number;
    abattementInfo: AbattementInfo;
    baseImposable: number;
    resultatImpot: ResultatCalculImpot;
    salaireNet: number;
    employe: {
      uuid: string;
      nom: string;
      prenom: string;
      nbEnfants: number;
    };
  }> {
    // 1. Récupérer l'employé pour connaître le nombre d'enfants
    const employe = await this.employeService.findOne(employeUuid);

    // 2. Calculer la base imposable avec abattement dynamique
    const { abattementInfo, baseImposable } =
      await this.calculerBaseImposableDynamique(brutTotal, plafondSME, date);

    // 3. Calculer l'impôt sur cette base (avec décote pour enfants)
    const resultatImpot = await this.calculerImpot(
      baseImposable,
      employe.nbEnfants,
      date,
    );

    // 4. Calculer le salaire net = Base imposable - Total impôt
    const salaireNet = Math.round(baseImposable - resultatImpot.totalImpot);

    return {
      brutTotal,
      plafondSME,
      abattementInfo,
      baseImposable,
      resultatImpot,
      salaireNet,
      employe: {
        uuid: employe.uuid,
        nom: employe.nom,
        prenom: employe.prenom || '',
        nbEnfants: employe.nbEnfants,
      },
    };
  }

  /**
   * Calcule l'impôt à partir du salaire brut (version dynamique simple sans employé)
   * @param brutTotal Salaire brut total
   * @param nbEnfants Nombre d'enfants à charge
   * @param plafondSME Plafond pour l'abattement
   * @param date Date de calcul
   */
  async calculerImpotDepuisBrutDynamiqueSimple(
    brutTotal: number,
    nbEnfants: number = 0,
    plafondSME: number = 2_400_000,
    date: Date = new Date(),
  ): Promise<{
    brutTotal: number;
    plafondSME: number;
    abattementInfo: AbattementInfo;
    baseImposable: number;
    resultatImpot: ResultatCalculImpot;
    salaireNet: number;
    nbEnfants: number;
  }> {
    // 1. Calculer la base imposable avec abattement dynamique
    const { abattementInfo, baseImposable } =
      await this.calculerBaseImposableDynamique(brutTotal, plafondSME, date);

    // 2. Calculer l'impôt sur cette base (avec décote pour enfants)
    const resultatImpot = await this.calculerImpot(
      baseImposable,
      nbEnfants,
      date,
    );

    // 3. Calculer le salaire net = Base imposable - Total impôt
    const salaireNet = Math.round(baseImposable - resultatImpot.totalImpot);

    return {
      brutTotal,
      plafondSME,
      abattementInfo,
      baseImposable,
      resultatImpot,
      salaireNet,
      nbEnfants,
    };
  }

  /**
   * Calcule l'impôt à partir du salaire brut (version statique)
   * @param brutTotal Salaire brut total
   * @param nbEnfants Nombre d'enfants à charge (défaut: 0)
   * @param date Date de calcul
   */
  async calculerImpotDepuisBrut(
    brutTotal: number,
    nbEnfants: number = 0,
    date: Date = new Date(),
  ): Promise<{
    brutTotal: number;
    abattement: number;
    baseImposable: number;
    resultatImpot: ResultatCalculImpot;
    salaireNet: number;
  }> {
    // Abattement de 2% sur le brut total
    const abattement = brutTotal * 0.02;
    const baseImposable = Math.round(brutTotal - abattement);

    // Calcul de l'impôt avec le nombre d'enfants
    const resultatImpot = await this.calculerImpot(
      baseImposable,
      nbEnfants,
      date,
    );

    // Salaire net = Base imposable - Impôt
    const salaireNet = Math.round(baseImposable - resultatImpot.totalImpot);

    return {
      brutTotal,
      abattement,
      baseImposable,
      resultatImpot,
      salaireNet,
    };
  }
}
