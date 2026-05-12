import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BulletinPaieEntity } from '../../bulletin/entities/bulletin.entity';
import { RubriqueEntity } from '../../rubrique/entities/rubrique.entity';

@Entity('lignes_bulletin')
export class LigneBulletinEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  // Clés étrangères
  @Column({ type: 'uuid' })
  bulletinUuid!: string;

  @Column({ type: 'uuid' })
  rubriqueUuid!: string;

  // Valeurs de la ligne
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  base!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  taux!: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montantSalarie!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  montantEmployeur!: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations

  @ManyToOne(() => BulletinPaieEntity, (bulletin) => bulletin.lignes)
  @JoinColumn({ name: 'bulletinUuid' })
  bulletin!: BulletinPaieEntity;

  @ManyToOne(() => RubriqueEntity)
  @JoinColumn({ name: 'rubriqueUuid' })
  rubrique!: RubriqueEntity;
}
