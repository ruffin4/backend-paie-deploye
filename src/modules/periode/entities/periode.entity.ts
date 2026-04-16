import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('periodes')
export class PeriodeEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ type: 'int' })
  mois!: number;

  @Column({ type: 'int' })
  annee!: number;

  @Column({ type: 'date' })
  dateDebut!: Date;

  @Column({ type: 'date' })
  dateFin!: Date;

  @Column({ default: false })
  cloturee!: boolean;

  @Column({ type: 'date', nullable: true })
  dateCloture!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
