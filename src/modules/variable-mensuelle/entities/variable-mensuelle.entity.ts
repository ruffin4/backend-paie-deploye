import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { EmployeEntity } from '../../employe/entities/employe.entity';
import { RubriqueEntity } from '../../rubrique/entities/rubrique.entity';
import { PeriodeEntity } from '../../periode/entities/periode.entity';

@Entity('variables_mensuelles')
@Unique(['employeUuid', 'rubriqueUuid', 'periodeUuid'])
export class VariableMensuelleEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  // Clés étrangères
  @Column({ type: 'uuid' })
  employeUuid!: string;

  @Column({ type: 'uuid' })
  rubriqueUuid!: string;

  @Column({ type: 'uuid' })
  periodeUuid!: string;

  // Valeurs
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montant!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  basePersonnalisee!: number | null;

  // Information
  @Column({ type: 'text', nullable: true })
  commentaire!: string | null;

  // Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => EmployeEntity)
  @JoinColumn({ name: 'employeUuid' })
  employe!: EmployeEntity;

  @ManyToOne(() => RubriqueEntity)
  @JoinColumn({ name: 'rubriqueUuid' })
  rubrique!: RubriqueEntity;

  @ManyToOne(() => PeriodeEntity)
  @JoinColumn({ name: 'periodeUuid' })
  periode!: PeriodeEntity;
}
