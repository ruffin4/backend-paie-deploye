/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariableMensuelleEntity } from './entities/variable-mensuelle.entity';
import { CreateVariableMensuelleDto } from './dto/create-variable-mensuelle.dto';
import { UpdateVariableMensuelleDto } from './dto/update-variable-mensuelle.dto';
import { FilterVariableMensuelleDto } from './dto/filter-variable-mensuelle.dto';

@Injectable()
export class VariableMensuelleService {
  constructor(
    @InjectRepository(VariableMensuelleEntity)
    private readonly variableRepository: Repository<VariableMensuelleEntity>,
  ) {}

  async create(
    createDto: CreateVariableMensuelleDto,
  ): Promise<VariableMensuelleEntity> {
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
    Object.assign(variable, updateDto);
    return this.variableRepository.save(variable);
  }

  async remove(uuid: string): Promise<void> {
    const result = await this.variableRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException(`Variable avec l'UUID "${uuid}" non trouvée`);
    }
  }

  async removeByPeriode(periodeUuid: string): Promise<void> {
    await this.variableRepository.delete({ periodeUuid });
  }

  async removeByEmployeAndPeriode(
    employeUuid: string,
    periodeUuid: string,
  ): Promise<void> {
    await this.variableRepository.delete({ employeUuid, periodeUuid });
  }
}
