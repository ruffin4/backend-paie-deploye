import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CalculIrsaEntity } from '../../calcul-irsa/entities/calcul-irsa.entity';
import { BarreIrsaEntity } from '../../barre-irsa/entities/barre-irsa.entity';

@Entity('lignes_calcul_irsa')
export class LigneCalculIrsaEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ type: 'uuid' })
  calculIrsaUuid!: string;

  @Column({ type: 'uuid' })
  trancheId!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montantTranche!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  impotTranche!: number;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => CalculIrsaEntity, (calcul) => calcul.lignes)
  @JoinColumn({ name: 'calculIrsaUuid' })
  calculIrsa!: CalculIrsaEntity;

  @ManyToOne(() => BarreIrsaEntity)
  @JoinColumn({ name: 'trancheId' })
  tranche!: BarreIrsaEntity;
}
