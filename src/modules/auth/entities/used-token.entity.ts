import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('used_tokens')
export class UsedTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ unique: true })
  token!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ name: 'used_at' })
  usedAt!: Date;
}
