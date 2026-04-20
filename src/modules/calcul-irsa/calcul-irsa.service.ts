import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalculIrsaEntity } from './entities/calcul-irsa.entity';
import { LigneCalculIrsaEntity } from '../ligne-calcul-irsa/entities/ligne-calcul-irsa.entity';
import { CreateCalculIrsaDto } from './dto/create-calcul-irsa.dto';
import { UpdateCalculIrsaDto } from './dto/update-calcul-irsa.dto';
import { ResultatCalculImpot } from '../barre-irsa/barre-irsa.service';

@Injectable()
export class CalculIrsaService {
  constructor(
    @InjectRepository(CalculIrsaEntity)
    private readonly calculRepository: Repository<CalculIrsaEntity>,
    @InjectRepository(LigneCalculIrsaEntity)
    private readonly ligneCalculRepository: Repository<LigneCalculIrsaEntity>,
  ) {}

  async create(createDto: CreateCalculIrsaDto): Promise<CalculIrsaEntity> {
    const calcul = this.calculRepository.create(createDto);
    return this.calculRepository.save(calcul);
  }

  async sauvegarderCalcul(
    bulletinUuid: string,
    baseImposable: number,
    abattement: number,
    resultatImpot: ResultatCalculImpot,
  ): Promise<CalculIrsaEntity> {
    // Supprimer l'ancien calcul s'il existe
    await this.deleteByBulletin(bulletinUuid);

    // Créer le nouveau calcul
    const calcul = this.calculRepository.create({
      bulletinUuid,
      baseImposable,
      abattement,
      totalImpot: resultatImpot.totalImpot,
      decote: resultatImpot.decote || 0,
      nbEnfants: resultatImpot.enfants || 0,
    });

    const savedCalcul = await this.calculRepository.save(calcul);

    // Sauvegarder les lignes de détail
    if (resultatImpot.details && resultatImpot.details.length > 0) {
      const lignes = resultatImpot.details.map((detail) =>
        this.ligneCalculRepository.create({
          calculIrsaUuid: savedCalcul.uuid,
          trancheId: detail.trancheUuid,
          montantTranche: detail.montantTranche,
          impotTranche: detail.impotTranche,
        }),
      );
      await this.ligneCalculRepository.save(lignes);
    }

    return savedCalcul;
  }

  async findAll(): Promise<CalculIrsaEntity[]> {
    return this.calculRepository.find({
      relations: ['bulletin', 'lignes', 'lignes.tranche'],
    });
  }

  async findOne(uuid: string): Promise<CalculIrsaEntity> {
    const calcul = await this.calculRepository.findOne({
      where: { uuid },
      relations: ['bulletin', 'lignes', 'lignes.tranche'],
    });
    if (!calcul) {
      throw new NotFoundException(
        `Calcul IRSA avec l'UUID "${uuid}" non trouvé`,
      );
    }
    return calcul;
  }

  async findByBulletin(bulletinUuid: string): Promise<CalculIrsaEntity | null> {
    return this.calculRepository.findOne({
      where: { bulletinUuid },
      relations: ['lignes', 'lignes.tranche'],
    });
  }

  async update(
    uuid: string,
    updateDto: UpdateCalculIrsaDto,
  ): Promise<CalculIrsaEntity> {
    const calcul = await this.findOne(uuid);
    Object.assign(calcul, updateDto);
    return this.calculRepository.save(calcul);
  }

  async remove(uuid: string): Promise<void> {
    const calcul = await this.findOne(uuid);
    await this.ligneCalculRepository.delete({ calculIrsaUuid: calcul.uuid });
    await this.calculRepository.delete({ uuid });
  }

  async deleteByBulletin(bulletinUuid: string): Promise<void> {
    const calcul = await this.findByBulletin(bulletinUuid);
    if (calcul) {
      await this.ligneCalculRepository.delete({ calculIrsaUuid: calcul.uuid });
      await this.calculRepository.delete({ bulletinUuid });
    }
  }

  async getDetailsImpots(bulletinUuid: string): Promise<{
    baseImposable: number;
    abattement: number;
    totalImpot: number;
    decote: number;
    nbEnfants: number;
    detailsParTranche: Array<{
      trancheMin: number;
      trancheMax: number | null;
      taux: number;
      montantTranche: number;
      impotTranche: number;
    }>;
  } | null> {
    const calcul = await this.findByBulletin(bulletinUuid);
    if (!calcul) return null;

    return {
      baseImposable: calcul.baseImposable,
      abattement: calcul.abattement,
      totalImpot: calcul.totalImpot,
      decote: calcul.decote,
      nbEnfants: calcul.nbEnfants,
      detailsParTranche: calcul.lignes.map((ligne) => ({
        trancheMin: ligne.tranche?.trancheMin || 0,
        trancheMax: ligne.tranche?.trancheMax || null,
        taux: ligne.tranche?.taux || 0,
        montantTranche: ligne.montantTranche,
        impotTranche: ligne.impotTranche,
      })),
    };
  }
}
