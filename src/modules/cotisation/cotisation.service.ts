import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CotisationEntity,
  TypeBaseCotisation,
} from './entities/cotisation.entity';
import { CreateCotisationDto } from './dto/create-cotisation.dto';
import { UpdateCotisationDto } from './dto/update-cotisation.dto';

export interface CotisationResult {
  montantSalarie: number;
  montantEmployeur: number;
  baseUtilisee: number;
  tauxSalarie: number;
  tauxEmployeur: number;
}

export interface BasesCotisation {
  cnaps?: number;
  ostie?: number;
  fmfpr?: number;
}

export interface CalculCotisationsResponse {
  brutTotal: number;
  brutImposable?: number;
  cotisations: {
    cnaps: CotisationResult;
    ostie: CotisationResult;
    fmfpr: CotisationResult;
  };
  totalSalarie: number;
  totalEmployeur: number;
  netAvantImpot: number;
}

@Injectable()
export class CotisationService {
  constructor(
    @InjectRepository(CotisationEntity)
    private readonly cotisationRepository: Repository<CotisationEntity>,
  ) {}

  async create(createDto: CreateCotisationDto): Promise<CotisationEntity> {
    const existing = await this.cotisationRepository.findOne({
      where: { code: createDto.code },
    });

    if (existing) {
      throw new ConflictException(
        `La cotisation avec le code "${createDto.code}" existe déjà`,
      );
    }

    const cotisation = this.cotisationRepository.create({
      ...createDto,
      dateDebut: new Date(createDto.dateDebut),
      dateFin: createDto.dateFin ? new Date(createDto.dateFin) : null,
    });

    return this.cotisationRepository.save(cotisation);
  }

  async findAll(): Promise<CotisationEntity[]> {
    return this.cotisationRepository.find({
      order: { code: 'ASC', dateDebut: 'DESC' },
    });
  }

  async findActive(): Promise<CotisationEntity[]> {
    const now = new Date();

    // Méthode 1: Avec QueryBuilder (recommandée)
    return this.cotisationRepository
      .createQueryBuilder('c')
      .where('c.actif = :actif', { actif: true })
      .andWhere('c.dateDebut <= :now', { now })
      .andWhere('(c.dateFin IS NULL OR c.dateFin >= :now)', { now })
      .orderBy('c.code', 'ASC')
      .getMany();
  }

  async findOne(uuid: string): Promise<CotisationEntity> {
    const cotisation = await this.cotisationRepository.findOne({
      where: { uuid },
    });
    if (!cotisation) {
      throw new NotFoundException(
        `Cotisation avec l'UUID "${uuid}" non trouvée`,
      );
    }
    return cotisation;
  }

  async findByCode(
    code: string,
    date: Date = new Date(),
  ): Promise<CotisationEntity | null> {
    const result = await this.cotisationRepository
      .createQueryBuilder('c')
      .where('UPPER(c.code) = UPPER(:code)', { code }) // ← Ignorer la casse
      .andWhere('c.actif = :actif', { actif: true })
      .andWhere('c.dateDebut <= :date', { date })
      .andWhere('(c.dateFin IS NULL OR c.dateFin >= :date)', { date })
      .getOne();

    return result;
  }

  async update(
    uuid: string,
    updateDto: UpdateCotisationDto,
  ): Promise<CotisationEntity> {
    const cotisation = await this.findOne(uuid);

    if (updateDto.code && updateDto.code !== cotisation.code) {
      const existing = await this.cotisationRepository.findOne({
        where: { code: updateDto.code },
      });
      if (existing) {
        throw new ConflictException(
          `La cotisation avec le code "${updateDto.code}" existe déjà`,
        );
      }
    }

    if (updateDto.dateDebut) {
      cotisation.dateDebut = new Date(updateDto.dateDebut);
    }
    if (updateDto.dateFin !== undefined) {
      cotisation.dateFin = updateDto.dateFin
        ? new Date(updateDto.dateFin)
        : null;
    }

    Object.assign(cotisation, updateDto);
    return this.cotisationRepository.save(cotisation);
  }

  async remove(uuid: string): Promise<void> {
    const result = await this.cotisationRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Cotisation avec l'UUID "${uuid}" non trouvée`,
      );
    }
  }

  // ==================== FONCTIONNALITÉS DE CALCUL ====================

  /**
   * Calcule une cotisation spécifique à partir du brut
   * @param code Code de la cotisation (CNaPS, OSTIE, FMFPR)
   * @param brutTotal Salaire brut total
   * @param brutImposable Salaire brut imposable (optionnel)
   * @param date Date de calcul (par défaut: aujourd'hui)
   */
  async calculerCotisation(
    code: string,
    brutTotal: number,
    brutImposable?: number,
    date: Date = new Date(),
  ): Promise<CotisationResult> {
    const cotisation = await this.findByCode(code, date);

    if (!cotisation) {
      throw new BadRequestException(
        `Cotisation "${code}" non trouvée ou inactive à cette date`,
      );
    }

    // Déterminer la base de calcul selon le type
    let base = 0;
    switch (cotisation.typeBase) {
      case TypeBaseCotisation.BRUT_TOTAL:
        base = brutTotal;
        break;
      case TypeBaseCotisation.BRUT_IMPOSABLE:
        base = brutImposable ?? brutTotal;
        break;
      case TypeBaseCotisation.PLAFONNE:
        base = cotisation.plafond
          ? Math.min(brutTotal, cotisation.plafond)
          : brutTotal;
        break;
    }

    return {
      montantSalarie: base * (cotisation.tauxSalarie / 100),
      montantEmployeur: base * (cotisation.tauxEmployeur / 100),
      baseUtilisee: base,
      tauxSalarie: cotisation.tauxSalarie,
      tauxEmployeur: cotisation.tauxEmployeur,
    };
  }

  /**
   * Calcule toutes les cotisations sociales (CNaPS, OSTIE, FMFPR)
   * à partir du salaire brut
   * @param brutTotal Salaire brut total
   * @param brutImposable Salaire brut imposable (optionnel)
   * @param date Date de calcul (par défaut: aujourd'hui)
   * @param bases Bases spécifiques par cotisation (optionnel)
   */
  async calculerCotisationsSociales(
    brutTotal: number,
    brutImposable?: number,
    date: Date = new Date(),
    bases?: BasesCotisation,
  ): Promise<CalculCotisationsResponse> {
    const imposable = brutImposable ?? brutTotal;

    const [cnaps, ostie, fmfpr] = await Promise.all([
      this.calculerCotisation(
        'CNaPS',
        bases?.cnaps ?? brutTotal,
        imposable,
        date,
      ),
      this.calculerCotisation(
        'OSTIE',
        bases?.ostie ?? brutTotal,
        imposable,
        date,
      ),
      this.calculerCotisation(
        'FMFPR',
        bases?.fmfpr ?? brutTotal,
        imposable,
        date,
      ),
    ]);

    const totalSalarie =
      cnaps.montantSalarie + ostie.montantSalarie + fmfpr.montantSalarie;
    const totalEmployeur =
      cnaps.montantEmployeur + ostie.montantEmployeur + fmfpr.montantEmployeur;

    return {
      brutTotal,
      brutImposable: imposable,
      cotisations: {
        cnaps,
        ostie,
        fmfpr,
      },
      totalSalarie,
      totalEmployeur,
      netAvantImpot: brutTotal - totalSalarie,
    };
  }

  /**
   * Calcule les cotisations avec un détail étape par étape
   * @param brutTotal Salaire brut total
   */
  async calculerCotisationsAvecDetail(brutTotal: number): Promise<{
    brutTotal: number;
    etapes: Array<{
      cotisation: string;
      tauxSalarie: number;
      tauxEmployeur: number;
      base: number;
      partSalarie: number;
      partEmployeur: number;
    }>;
    recapitulatif: {
      totalPartSalarie: number;
      totalPartEmployeur: number;
      netAvantImpot: number;
      coutTotalEmployeur: number;
    };
  }> {
    const result = await this.calculerCotisationsSociales(brutTotal);

    const etapes = [
      {
        cotisation: 'CNaPS',
        tauxSalarie: result.cotisations.cnaps.tauxSalarie,
        tauxEmployeur: result.cotisations.cnaps.tauxEmployeur,
        base: result.cotisations.cnaps.baseUtilisee,
        partSalarie: result.cotisations.cnaps.montantSalarie,
        partEmployeur: result.cotisations.cnaps.montantEmployeur,
      },
      {
        cotisation: 'OSTIE',
        tauxSalarie: result.cotisations.ostie.tauxSalarie,
        tauxEmployeur: result.cotisations.ostie.tauxEmployeur,
        base: result.cotisations.ostie.baseUtilisee,
        partSalarie: result.cotisations.ostie.montantSalarie,
        partEmployeur: result.cotisations.ostie.montantEmployeur,
      },
      {
        cotisation: 'FMFPR',
        tauxSalarie: result.cotisations.fmfpr.tauxSalarie,
        tauxEmployeur: result.cotisations.fmfpr.tauxEmployeur,
        base: result.cotisations.fmfpr.baseUtilisee,
        partSalarie: result.cotisations.fmfpr.montantSalarie,
        partEmployeur: result.cotisations.fmfpr.montantEmployeur,
      },
    ];

    return {
      brutTotal: result.brutTotal,
      etapes,
      recapitulatif: {
        totalPartSalarie: result.totalSalarie,
        totalPartEmployeur: result.totalEmployeur,
        netAvantImpot: result.netAvantImpot,
        coutTotalEmployeur: result.brutTotal + result.totalEmployeur,
      },
    };
  }

  /**
   * Obtenir les taux actuels des cotisations
   */
  async getTauxActuels(): Promise<{
    cnaps: {
      tauxSalarie: number;
      tauxEmployeur: number;
      typeBase: string;
    } | null;
    ostie: {
      tauxSalarie: number;
      tauxEmployeur: number;
      typeBase: string;
    } | null;
    fmfpr: {
      tauxSalarie: number;
      tauxEmployeur: number;
      typeBase: string;
    } | null;
  }> {
    const [cnaps, ostie, fmfpr] = await Promise.all([
      this.findByCode('CNaPS'),
      this.findByCode('OSTIE'),
      this.findByCode('FMFPR'),
    ]);

    return {
      cnaps: cnaps
        ? {
            tauxSalarie: cnaps.tauxSalarie,
            tauxEmployeur: cnaps.tauxEmployeur,
            typeBase: cnaps.typeBase,
          }
        : null,
      ostie: ostie
        ? {
            tauxSalarie: ostie.tauxSalarie,
            tauxEmployeur: ostie.tauxEmployeur,
            typeBase: ostie.typeBase,
          }
        : null,
      fmfpr: fmfpr
        ? {
            tauxSalarie: fmfpr.tauxSalarie,
            tauxEmployeur: fmfpr.tauxEmployeur,
            typeBase: fmfpr.typeBase,
          }
        : null,
    };
  }
}
