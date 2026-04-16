import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum TypeRubrique {
  GAIN = 'GAIN',
  RETENUE = 'RETENUE',
  INDEMNITE = 'INDEMNITE',
  PRIME = 'PRIME',
  AVANTAGE_NATURE = 'AVANTAGE_NATURE',
}

export enum ModeCalcul {
  FIXE = 'FIXE',
  POURCENTAGE_SALAIRE = 'POURCENTAGE_SALAIRE',
  TAUX_HORAIRE = 'TAUX_HORAIRE',
}

export enum SensRubrique {
  POSITIF = 'POSITIF',
  NEGATIF = 'NEGATIF',
}

@Entity('rubriques')
export class RubriqueEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  // Identification
  @Column({ unique: true, length: 50 })
  code!: string;

  // Information
  @Column({ length: 200 })
  libelle!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  // Classification
  @Column({ type: 'enum', enum: TypeRubrique })
  type!: TypeRubrique;

  // Calcul
  @Column({ type: 'enum', enum: ModeCalcul })
  modeCalcul!: ModeCalcul;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  valeurFixe!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  pourcentageBase!: number;

  // Règles fiscales et sociales
  @Column({ default: true })
  estImposableIRSA!: boolean;

  @Column({ default: true })
  estCotisableCNaPS!: boolean;

  @Column({ default: true })
  estCotisableOSTIE!: boolean;

  @Column({ default: true })
  estCotisableFMFPR!: boolean;

  // Affichage
  @Column({ type: 'enum', enum: SensRubrique, default: SensRubrique.POSITIF })
  sens!: SensRubrique;

  @Column({ default: 0 })
  ordreAffichage!: number;

  // Statut
  @Column({ default: true })
  actif!: boolean;

  // Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany('VariableMensuelleEntity', 'rubrique')
  variablesMensuelles!: any[];
}
