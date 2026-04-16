import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('barre_irsa')
export class BarreIrsaEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  trancheMin!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  trancheMax!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  taux!: number;

  @Column({ type: 'int' })
  ordre!: number;

  @Column({ type: 'date' })
  dateDebut!: Date;

  @Column({ type: 'date', nullable: true })
  dateFin!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
