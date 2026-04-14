import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EmployeEntity } from './entities/employe.entity';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';

@Injectable()
export class EmployeService {
  constructor(
    @InjectRepository(EmployeEntity)
    private readonly employeRepository: Repository<EmployeEntity>,
  ) {}

  async create(createDto: CreateEmployeDto): Promise<EmployeEntity> {
    // Vérifier si le matricule interne existe déjà
    const existing = await this.employeRepository.findOne({
      where: { matriculeInterne: createDto.matriculeInterne },
    });
    if (existing) {
      throw new ConflictException('Le matricule interne existe déjà');
    }

    const employe = new EmployeEntity();

    employe.matriculeInterne = createDto.matriculeInterne;
    employe.matriculeCnaps = createDto.matriculeCnaps;
    employe.nom = createDto.nom;
    employe.prenom = createDto.prenom;

    if (createDto.dateSortie) {
      employe.dateSortie = new Date(createDto.dateSortie);
    }

    const payload: DeepPartial<EmployeEntity> = {
      matriculeInterne: createDto.matriculeInterne,
      matriculeCnaps: createDto.matriculeCnaps,
      nom: createDto.nom,
      prenom: createDto.prenom,
      dateEmbauche: new Date(createDto.dateEmbauche),
      typeContrat: createDto.typeContrat,
      dateSortie: createDto.dateSortie
        ? new Date(createDto.dateSortie)
        : undefined,
      fonction: createDto.fonction,
      categorie: createDto.categorie,
      salaireBaseMensuel: createDto.salaireBaseMensuel,
      nbEnfants: createDto.nbEnfants ?? 0,
      actif: createDto.actif ?? true,
    };
    const matriculeExists = await this.employeRepository.findOne({
      where: { matriculeInterne: createDto.matriculeInterne },
    });
    if (matriculeExists) {
      throw new NotFoundException('Le matricule interne existe déjà');
    }

    const entity = this.employeRepository.create(payload);
    return await this.employeRepository.save(entity);
  }

  async findAll(): Promise<EmployeEntity[]> {
    return this.employeRepository.find();
  }

  async findOne(uuid: string): Promise<EmployeEntity> {
    const employe = await this.employeRepository.findOne({ where: { uuid } });
    if (!employe) {
      throw new NotFoundException('Employé non trouvé');
    }
    return employe;
  }

  async update(
    uuid: string,
    updateDto: UpdateEmployeDto,
  ): Promise<EmployeEntity> {
    const employe = await this.findOne(uuid);

    // Si on modifie le matricule, s'assurer qu'il n'appartient pas à un autre employé
    if (
      updateDto.matriculeInterne !== undefined &&
      updateDto.matriculeInterne !== employe.matriculeInterne
    ) {
      const other = await this.employeRepository.findOne({
        where: { matriculeInterne: updateDto.matriculeInterne },
      });
      if (other && other.uuid !== employe.uuid) {
        throw new ConflictException('Le matricule interne existe déjà');
      }
    }

    if (updateDto.matriculeInterne !== undefined) {
      employe.matriculeInterne = updateDto.matriculeInterne;
    }
    if (updateDto.matriculeCnaps !== undefined) {
      employe.matriculeCnaps = updateDto.matriculeCnaps;
    }
    if (updateDto.nom !== undefined) {
      employe.nom = updateDto.nom;
    }
    if (updateDto.prenom !== undefined) {
      employe.prenom = updateDto.prenom;
    }
    if (updateDto.dateEmbauche !== undefined) {
      employe.dateEmbauche = new Date(updateDto.dateEmbauche);
    }
    if (updateDto.dateSortie !== undefined) {
      employe.dateSortie = updateDto.dateSortie
        ? new Date(updateDto.dateSortie)
        : undefined;
    }
    if (updateDto.typeContrat !== undefined) {
      employe.typeContrat = updateDto.typeContrat;
    }
    if (updateDto.fonction !== undefined) {
      employe.fonction = updateDto.fonction;
    }
    if (updateDto.categorie !== undefined) {
      employe.categorie = updateDto.categorie;
    }
    if (updateDto.salaireBaseMensuel !== undefined) {
      employe.salaireBaseMensuel = updateDto.salaireBaseMensuel;
    }
    if (updateDto.nbEnfants !== undefined) {
      employe.nbEnfants = updateDto.nbEnfants;
    }
    if (updateDto.actif !== undefined) {
      employe.actif = updateDto.actif;
    }

    return this.employeRepository.save(employe);
  }

  async remove(uuid: string): Promise<void> {
    const result = await this.employeRepository.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException('Employé non trouvé');
    }
  }
}
