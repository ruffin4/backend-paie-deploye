import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LigneCalculIrsaEntity } from './entities/ligne-calcul-irsa.entity';
import { CreateLigneCalculIrsaDto } from './dto/create-ligne-calcul-irsa.dto';
import { UpdateLigneCalculIrsaDto } from './dto/update-ligne-calcul-irsa.dto';

@Injectable()
export class LigneCalculIrsaService {
  constructor(
    @InjectRepository(LigneCalculIrsaEntity)
    private readonly ligneRepository: Repository<LigneCalculIrsaEntity>,
  ) {}

  async create(
    createDto: CreateLigneCalculIrsaDto,
  ): Promise<LigneCalculIrsaEntity> {
    const ligne = this.ligneRepository.create(createDto);
    return this.ligneRepository.save(ligne);
  }

  async createMany(
    lignesData: Omit<CreateLigneCalculIrsaDto, 'calculIrsaUuid'>[],
    calculIrsaUuid: string,
  ): Promise<LigneCalculIrsaEntity[]> {
    const lignes = lignesData.map((data) =>
      this.ligneRepository.create({
        ...data,
        calculIrsaUuid,
      }),
    );
    return this.ligneRepository.save(lignes);
  }

  async findAll(): Promise<LigneCalculIrsaEntity[]> {
    return this.ligneRepository.find({
      relations: ['calculIrsa', 'tranche'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByCalculIrsa(
    calculIrsaUuid: string,
  ): Promise<LigneCalculIrsaEntity[]> {
    return this.ligneRepository.find({
      where: { calculIrsaUuid },
      relations: ['tranche'],
      order: { trancheId: 'ASC' },
    });
  }

  async findOne(uuid: string): Promise<LigneCalculIrsaEntity> {
    const ligne = await this.ligneRepository.findOne({
      where: { uuid },
      relations: ['calculIrsa', 'tranche'],
    });
    if (!ligne) {
      throw new NotFoundException(
        `Ligne de calcul IRSA avec l'UUID "${uuid}" non trouvée`,
      );
    }
    return ligne;
  }

  async update(
    uuid: string,
    updateDto: UpdateLigneCalculIrsaDto,
  ): Promise<LigneCalculIrsaEntity> {
    const ligne = await this.findOne(uuid);
    Object.assign(ligne, updateDto);
    return this.ligneRepository.save(ligne);
  }

  async remove(uuid: string): Promise<void> {
    const result = await this.ligneRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Ligne de calcul IRSA avec l'UUID "${uuid}" non trouvée`,
      );
    }
  }

  async deleteByCalculIrsa(calculIrsaUuid: string): Promise<void> {
    await this.ligneRepository.delete({ calculIrsaUuid });
  }

  async getTotalImpot(calculIrsaUuid: string): Promise<number> {
    const lignes = await this.ligneRepository.find({
      where: { calculIrsaUuid },
    });
    return lignes.reduce((sum, l) => sum + l.impotTranche, 0);
  }
}
