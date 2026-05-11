import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true, nullable: true })
  username?: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash?: string;

  @Column({ nullable: true })
  nom?: string;

  @Column({ nullable: true })
  prenom?: string;

  @Column({
    type: 'enum',
    enum: ['ADMIN', 'GESTIONNAIRE'],
    default: 'GESTIONNAIRE',
  })
  role!: 'ADMIN' | 'GESTIONNAIRE';

  @Column({ name: 'must_set_password', default: false })
  mustSetPassword!: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
