/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariableMensuelleEntity } from './entities/variable-mensuelle.entity';
import { CreateVariableMensuelleDto } from './dto/create-variable-mensuelle.dto';
import { UpdateVariableMensuelleDto } from './dto/update-variable-mensuelle.dto';
import { FilterVariableMensuelleDto } from './dto/filter-variable-mensuelle.dto';
import { PeriodeService } from '../periode/periode.service';

@Injectable()
export class VariableMensuelleService {
  constructor(
    @InjectRepository(VariableMensuelleEntity)
    private readonly variableRepository: Repository<VariableMensuelleEntity>,
    private readonly periodeService: PeriodeService,
  ) {}

  async create(
    createDto: CreateVariableMensuelleDto,
  ): Promise<VariableMensuelleEntity> {
    if (await this.periodeService.isClosed(createDto.periodeUuid)) {
      throw new ForbiddenException('La période est clôturée');
    }
    // Vérifier si une variable existe déjà pour cette combinaison
    const existing = await this.variableRepository.findOne({
      where: {
        employeUuid: createDto.employeUuid,
        rubriqueUuid: createDto.rubriqueUuid,
        periodeUuid: createDto.periodeUuid,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Une variable existe déjà pour cet employé, cette rubrique et cette période',
      );
    }

    const variable = this.variableRepository.create(createDto);
    return this.variableRepository.save(variable);
  }

  async createMany(
    dtos: CreateVariableMensuelleDto[],
  ): Promise<VariableMensuelleEntity[]> {
    // eslint-disable-next-line prettier/prettier
    if (dtos.length > 0 && await this.periodeService.isClosed(dtos[0].periodeUuid)) {
      throw new ForbiddenException('La période est clôturée');
    }
    const results: VariableMensuelleEntity[] = [];
    for (const dto of dtos) {
      // Pour le bulk, on écrase si ça existe déjà (upsert)
      const existing = await this.variableRepository.findOne({
        where: {
          employeUuid: dto.employeUuid,
          rubriqueUuid: dto.rubriqueUuid,
          periodeUuid: dto.periodeUuid,
        },
      });

      if (existing) {
        Object.assign(existing, dto);
        results.push(await this.variableRepository.save(existing));
      } else {
        const variable = this.variableRepository.create(dto);
        results.push(await this.variableRepository.save(variable));
      }
    }
    return results;
  }

  async findAll(
    filter?: FilterVariableMensuelleDto,
  ): Promise<VariableMensuelleEntity[]> {
    const where: any = {};

    if (filter?.employeUuid) where.employeUuid = filter.employeUuid;
    if (filter?.rubriqueUuid) where.rubriqueUuid = filter.rubriqueUuid;
    if (filter?.periodeUuid) where.periodeUuid = filter.periodeUuid;

    return this.variableRepository.find({
      where,
      relations: ['employe', 'rubrique', 'periode'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(uuid: string): Promise<VariableMensuelleEntity> {
    const variable = await this.variableRepository.findOne({
      where: { uuid },
      relations: ['employe', 'rubrique', 'periode'],
    });
    if (!variable) {
      throw new NotFoundException(`Variable avec l'UUID "${uuid}" non trouvée`);
    }
    return variable;
  }

  async findByPeriode(periodeUuid: string): Promise<VariableMensuelleEntity[]> {
    return this.variableRepository.find({
      where: { periodeUuid },
      relations: ['employe', 'rubrique'],
    });
  }

  async findByEmployeAndPeriode(
    employeUuid: string,
    periodeUuid: string,
  ): Promise<VariableMensuelleEntity[]> {
    return this.variableRepository.find({
      where: { employeUuid, periodeUuid },
      relations: ['rubrique'],
    });
  }

  async update(
    uuid: string,
    updateDto: UpdateVariableMensuelleDto,
  ): Promise<VariableMensuelleEntity> {
    const variable = await this.findOne(uuid);
    if (await this.periodeService.isClosed(variable.periodeUuid)) {
      throw new ForbiddenException('La période est clôturée');
    }
    Object.assign(variable, updateDto);
    return this.variableRepository.save(variable);
  }

  async remove(uuid: string): Promise<void> {
    const variable = await this.findOne(uuid);
    if (await this.periodeService.isClosed(variable.periodeUuid)) {
      throw new ForbiddenException('La période est clôturée');
    }
    const result = await this.variableRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException(`Variable avec l'UUID "${uuid}" non trouvée`);
    }
  }

  async removeByPeriode(periodeUuid: string): Promise<void> {
    if (await this.periodeService.isClosed(periodeUuid)) {
      throw new ForbiddenException('La période est clôturée');
    }
    await this.variableRepository.delete({ periodeUuid });
  }

  async removeByEmployeAndPeriode(
    employeUuid: string,
    periodeUuid: string,
  ): Promise<void> {
    if (await this.periodeService.isClosed(periodeUuid)) {
      throw new ForbiddenException('La période est clôturée');
    }
    await this.variableRepository.delete({ employeUuid, periodeUuid });
  }
}
