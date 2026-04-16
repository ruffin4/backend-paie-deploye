import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TypeBaseCotisation {
  BRUT_TOTAL = 'BRUT_TOTAL',
  BRUT_IMPOSABLE = 'BRUT_IMPOSABLE',
  PLAFONNE = 'PLAFONNE',
}

@Entity('cotisations_legales')
export class CotisationEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  // Identification
  @Column({ unique: true, length: 20 })
  code!: string;

  // Information
  @Column({ length: 200 })
  libelle!: string;

  // Taux
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  tauxSalarie!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  tauxEmployeur!: number;

  // Règles de calcul
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  plafond!: number | null;

  @Column({
    type: 'enum',
    enum: TypeBaseCotisation,
    default: TypeBaseCotisation.BRUT_TOTAL,
  })
  typeBase!: TypeBaseCotisation;

  // Validité
  @Column({ default: true })
  actif!: boolean;

  @Column({ type: 'date' })
  dateDebut!: Date;

  @Column({ type: 'date', nullable: true })
  dateFin!: Date | null;

  // Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
