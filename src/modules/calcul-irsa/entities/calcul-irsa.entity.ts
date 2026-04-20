import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BulletinPaieEntity } from '../../bulletin/entities/bulletin.entity';
import { LigneCalculIrsaEntity } from '../../ligne-calcul-irsa/entities/ligne-calcul-irsa.entity';

@Entity('calculs_irsa')
export class CalculIrsaEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ type: 'uuid' })
  bulletinUuid!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  baseImposable!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  abattement!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalImpot!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  decote!: number;

  @Column({ type: 'integer', default: 0 })
  nbEnfants!: number;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @OneToOne(() => BulletinPaieEntity)
  @JoinColumn({ name: 'bulletinUuid' })
  bulletin!: BulletinPaieEntity;

  @OneToMany(() => LigneCalculIrsaEntity, (ligne) => ligne.calculIrsa)
  lignes!: LigneCalculIrsaEntity[];
}
