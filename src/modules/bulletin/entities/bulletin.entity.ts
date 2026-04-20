import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EmployeEntity } from '../../employe/entities/employe.entity';
import { PeriodeEntity } from '../../periode/entities/periode.entity';
import { LigneBulletinEntity } from '../../ligne-bulletin/entities/ligne-bulletin.entity';
import { CalculIrsaEntity } from '../../calcul-irsa/entities/calcul-irsa.entity';

export enum StatutBulletin {
  BROUILLON = 'BROUILLON',
  CALCULE = 'CALCULE',
  VALIDE = 'VALIDE',
  GENERE = 'GENERE',
  ANNULE = 'ANNULE',
}

@Entity('bulletins')
export class BulletinPaieEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  // Clés étrangères
  @Column({ type: 'uuid' })
  employeUuid!: string;

  @Column({ type: 'uuid' })
  periodeUuid!: string;

  // Informations du bulletin
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  dateEdition!: Date;

  @Column({ type: 'varchar', length: 20, default: StatutBulletin.BROUILLON })
  statut!: StatutBulletin;

  // Montants
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  salaireBrut!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalRetenues!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCotisationsPatronales!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netAPayer!: number;

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

  @ManyToOne(() => PeriodeEntity)
  @JoinColumn({ name: 'periodeUuid' })
  periode!: PeriodeEntity;

  @OneToMany(() => LigneBulletinEntity, (ligne) => ligne.bulletin)
  lignes!: LigneBulletinEntity[];

  @OneToOne(() => CalculIrsaEntity, (calcul) => calcul.bulletin)
  calculIrsa!: CalculIrsaEntity;
}
