/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RubriqueEntity } from './entities/rubrique.entity';
import { CreateRubriqueDto } from './dto/create-rubrique.dto';
import { UpdateRubriqueDto } from './dto/update-rubrique.dto';

@Injectable()
export class RubriqueService {
  constructor(
    @InjectRepository(RubriqueEntity)
    private readonly rubriqueRepository: Repository<RubriqueEntity>,
  ) {}

  async create(createDto: CreateRubriqueDto): Promise<RubriqueEntity> {
    // Vérifier si le code existe déjà
    const existingRubrique = await this.rubriqueRepository.findOne({
      where: { code: createDto.code },
    });
    if (existingRubrique) {
      throw new ConflictException(
        `Une rubrique avec le code "${createDto.code}" existe déjà`,
      );
    }

    const rubrique = this.rubriqueRepository.create(createDto);
    return this.rubriqueRepository.save(rubrique);
  }

  async findAll(): Promise<RubriqueEntity[]> {
    return this.rubriqueRepository.find({
      order: { ordreAffichage: 'ASC', code: 'ASC' },
    });
  }

  async findAllActive(): Promise<RubriqueEntity[]> {
    return this.rubriqueRepository.find({
      where: { actif: true },
      order: { ordreAffichage: 'ASC', code: 'ASC' },
    });
  }

  async findOne(uuid: string): Promise<RubriqueEntity> {
    const rubrique = await this.rubriqueRepository.findOne({ where: { uuid } });
    if (!rubrique) {
      throw new NotFoundException(`Rubrique avec l'UUID "${uuid}" non trouvée`);
    }
    return rubrique;
  }

  async findByCode(code: string): Promise<RubriqueEntity | null> {
    return this.rubriqueRepository.findOne({ where: { code } });
  }

  async findByType(type: string): Promise<RubriqueEntity[]> {
    return this.rubriqueRepository.find({
      where: { type: type as any, actif: true },
      order: { ordreAffichage: 'ASC' },
    });
  }

  async update(
    uuid: string,
    updateDto: UpdateRubriqueDto,
  ): Promise<RubriqueEntity> {
    const rubrique = await this.findOne(uuid);

    // Vérifier si le nouveau code n'est pas déjà utilisé par une autre rubrique
    if (updateDto.code && updateDto.code !== rubrique.code) {
      const existingRubrique = await this.rubriqueRepository.findOne({
        where: { code: updateDto.code },
      });
      if (existingRubrique) {
        throw new ConflictException(
          `Une rubrique avec le code "${updateDto.code}" existe déjà`,
        );
      }
    }

    Object.assign(rubrique, updateDto);
    return this.rubriqueRepository.save(rubrique);
  }

  async remove(uuid: string): Promise<void> {
    const rubrique = await this.findOne(uuid);

    // Soft delete : désactiver au lieu de supprimer
    rubrique.actif = false;
    await this.rubriqueRepository.save(rubrique);
  }

  async hardRemove(uuid: string): Promise<void> {
    const result = await this.rubriqueRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException(`Rubrique avec l'UUID "${uuid}" non trouvée`);
    }
  }

  async restore(uuid: string): Promise<RubriqueEntity> {
    const rubrique = await this.rubriqueRepository.findOne({ where: { uuid } });
    if (!rubrique) {
      throw new NotFoundException(`Rubrique avec l'UUID "${uuid}" non trouvée`);
    }
    rubrique.actif = true;
    return this.rubriqueRepository.save(rubrique);
  }
}
