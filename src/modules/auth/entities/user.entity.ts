import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ nullable: true })
  nom?: string;

  @Column({ nullable: true })
  prenom?: string;

  @Column({
    type: 'enum',
    enum: ['ADMIN', 'USER', 'GESTIONNAIRE'],
    default: 'USER',
  })
  role!: 'ADMIN' | 'USER' | 'GESTIONNAIRE';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
