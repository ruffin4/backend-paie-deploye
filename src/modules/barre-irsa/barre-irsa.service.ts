import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { BarreIrsaEntity } from './entities/barre-irsa.entity';
import { CreateBarreIrsaDto } from './dto/create-barre-irsa.dto';
import { UpdateBarreIrsaDto } from './dto/update-barre-irsa.dto';

export interface DetailImpot {
  trancheMin: number;
  trancheMax: number | null;
  taux: number;
  montantTranche: number;
  impotTranche: number;
}

export interface ResultatCalculImpot {
  totalImpot: number;
  details: DetailImpot[];
}

@Injectable()
export class BarreIrsaService {
  constructor(
    @InjectRepository(BarreIrsaEntity)
    private readonly barreIrsaRepository: Repository<BarreIrsaEntity>,
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
   * Calcule l'impôt à partir de la base imposable
   */
  async calculerImpot(
    baseImposable: number,
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

    return {
      totalImpot: totalImpot,
      details,
    };
  }

  /**
   * Calcule la base imposable à partir du salaire brut
   * Règle: Abattement de 2% sur le brut total
   * @param brutTotal Salaire brut total
   */
  calculerBaseImposable(brutTotal: number): {
    brutTotal: number;
    abattement: number;
    baseImposable: number;
  } {
    const abattement = brutTotal * 0.02;
    const baseImposable = Math.round(brutTotal - abattement);

    return {
      brutTotal,
      abattement,
      baseImposable,
    };
  }

  /**
   * Calcule l'impôt à partir du salaire brut (calcul automatique)
   * @param brutTotal Salaire brut total
   * @param date Date de calcul
   */
  async calculerImpotDepuisBrut(
    brutTotal: number,
    date: Date = new Date(),
  ): Promise<{
    brutTotal: number;
    abattement: number;
    baseImposable: number;
    resultatImpot: ResultatCalculImpot;
    salaireNet: number;
  }> {
    // 1. Calculer la base imposable (abattement 2% sur brut total)
    const { abattement, baseImposable } = this.calculerBaseImposable(brutTotal);

    // 2. Calculer l'impôt sur cette base
    const resultatImpot = await this.calculerImpot(baseImposable, date);

    // 3. Calculer le salaire net = Base imposable - Total impôt
    const salaireNet = baseImposable - resultatImpot.totalImpot;

    return {
      brutTotal,
      abattement,
      baseImposable,
      resultatImpot,
      salaireNet,
    };
  }
}
