import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum TypeContrat {
  CDI = 'CDI',
  CDD = 'CDD',
  STAGIAIRE = 'STAGIAIRE',
}

@Entity('employes')
export class EmployeEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  // Identification
  @Column({ unique: true, length: 50 })
  matriculeInterne!: string;

  @Column({ length: 50, nullable: true })
  matriculeCnaps?: string;

  // Identité
  @Column({ length: 100 })
  nom!: string;

  @Column({ length: 100, nullable: true })
  prenom?: string;

  // Contrat
  @Column({ type: 'date' })
  dateEmbauche!: Date;

  @Column({ type: 'enum', enum: TypeContrat, default: TypeContrat.CDI })
  typeContrat!: TypeContrat;

  @Column({ type: 'date', nullable: true })
  dateSortie?: Date;

  // Poste
  @Column({ length: 100, nullable: true })
  fonction?: string;

  @Column({ length: 20, nullable: true })
  categorie?: string;

  // Paie
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  salaireBaseMensuel!: number;

  // Situation familiale
  @Column({ default: 0 })
  nbEnfants!: number;

  // Contact
  @Column({ length: 255, nullable: true })
  adresse?: string;

  @Column({ length: 20, nullable: true })
  telephone?: string;

  // Statut
  @Column({ default: true })
  actif!: boolean;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relation OneToMany vers VariableMensuelle
  @OneToMany('VariableMensuelleEntity', 'employe')
  variablesMensuelles!: any[];
}

export default EmployeEntity;
