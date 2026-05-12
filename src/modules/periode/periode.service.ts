/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PeriodeEntity } from './entities/periode.entity';
import { CreatePeriodeDto } from './dto/create-periode.dto';
import { UpdatePeriodeDto } from './dto/update-periode.dto';
import { CloturerPeriodeDto } from './dto/cloturer-periode.dto';

@Injectable()
export class PeriodeService {
  constructor(
    @InjectRepository(PeriodeEntity)
    private readonly periodeRepository: Repository<PeriodeEntity>,
  ) {}

  async isClosed(uuid: string): Promise<boolean> {
    const periode = await this.periodeRepository.findOne({ where: { uuid } });
    return periode?.cloturee || false;
  }

  async create(createDto: CreatePeriodeDto): Promise<PeriodeEntity> {
    // Vérifier si la période existe déjà
    const existingPeriode = await this.periodeRepository.findOne({
      where: {
        mois: createDto.mois,
        annee: createDto.annee,
      },
    });

    if (existingPeriode) {
      throw new ConflictException(
        `La période ${createDto.mois}/${createDto.annee} existe déjà`,
      );
    }

    // Vérifier la cohérence des dates
    const dateDebut = new Date(createDto.dateDebut);
    const dateFin = new Date(createDto.dateFin);

    if (dateDebut > dateFin) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin',
      );
    }

    const periode = this.periodeRepository.create({
      ...createDto,
      dateDebut,
      dateFin,
    });

    return this.periodeRepository.save(periode);
  }

  async findAll(): Promise<PeriodeEntity[]> {
    return this.periodeRepository.find({
      order: { annee: 'DESC', mois: 'DESC' },
    });
  }

  async findCurrent(): Promise<PeriodeEntity | null> {
    const now = new Date();
    return this.periodeRepository.findOne({
      where: {
        dateDebut: Between(
          new Date(now.getFullYear(), now.getMonth(), 1),
          new Date(now.getFullYear(), now.getMonth() + 1, 0),
        ),
      },
    });
  }

  async findOne(uuid: string): Promise<PeriodeEntity> {
    const periode = await this.periodeRepository.findOne({ where: { uuid } });
    if (!periode) {
      throw new NotFoundException(`Période avec l'UUID "${uuid}" non trouvée`);
    }
    return periode;
  }

  async findByMoisAnnee(
    mois: number,
    annee: number,
  ): Promise<PeriodeEntity | null> {
    return this.periodeRepository.findOne({
      where: { mois, annee },
    });
  }

  async update(
    uuid: string,
    updateDto: UpdatePeriodeDto,
  ): Promise<PeriodeEntity> {
    const periode = await this.findOne(uuid);

    // Vérifier si la période est clôturée
    if (periode.cloturee) {
      throw new BadRequestException(
        'Impossible de modifier une période clôturée',
      );
    }

    // Vérifier les conflits de période
    if (updateDto.mois && updateDto.annee) {
      const existingPeriode = await this.periodeRepository.findOne({
        where: {
          mois: updateDto.mois,
          annee: updateDto.annee,
          uuid: { $ne: uuid } as any,
        },
      });
      if (existingPeriode) {
        throw new ConflictException(
          `La période ${updateDto.mois}/${updateDto.annee} existe déjà`,
        );
      }
    }

    Object.assign(periode, updateDto);

    if (updateDto.dateDebut) {
      periode.dateDebut = new Date(updateDto.dateDebut);
    }
    if (updateDto.dateFin) {
      periode.dateFin = new Date(updateDto.dateFin);
    }

    return this.periodeRepository.save(periode);
  }

  async cloturer(
    uuid: string,
    dto: CloturerPeriodeDto,
  ): Promise<PeriodeEntity> {
    const periode = await this.findOne(uuid);

    if (periode.cloturee) {
      throw new BadRequestException('Cette période est déjà clôturée');
    }

    periode.cloturee = true;
    periode.dateCloture = dto.dateCloture
      ? new Date(dto.dateCloture)
      : new Date();

    return this.periodeRepository.save(periode);
  }

  async rouvrir(uuid: string): Promise<PeriodeEntity> {
    const periode = await this.findOne(uuid);

    if (!periode.cloturee) {
      throw new BadRequestException("Cette période n'est pas clôturée");
    }

    periode.cloturee = false;
    periode.dateCloture = null;

    return this.periodeRepository.save(periode);
  }

  async remove(uuid: string): Promise<void> {
    const periode = await this.findOne(uuid);

    if (periode.cloturee) {
      throw new BadRequestException(
        'Impossible de supprimer une période clôturée',
      );
    }

    const result = await this.periodeRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException(`Période avec l'UUID "${uuid}" non trouvée`);
    }
  }

  async getPeriodePrecedente(uuid: string): Promise<PeriodeEntity | null> {
    const periode = await this.findOne(uuid);

    return this.periodeRepository
      .createQueryBuilder('periode')
      .where('(annee < :annee) OR (annee = :annee AND mois < :mois)', {
        annee: periode.annee,
        mois: periode.mois,
      })
      .orderBy('annee', 'DESC')
      .addOrderBy('mois', 'DESC')
      .getOne();
  }

  async getPeriodeSuivante(uuid: string): Promise<PeriodeEntity | null> {
    const periode = await this.findOne(uuid);

    return this.periodeRepository
      .createQueryBuilder('periode')
      .where('(annee > :annee) OR (annee = :annee AND mois > :mois)', {
        annee: periode.annee,
        mois: periode.mois,
      })
      .orderBy('annee', 'ASC')
      .addOrderBy('mois', 'ASC')
      .getOne();
  }
}
