import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmployerVerificationStatus } from '../../common/enums/employer-verification-status.enum';
import { UserEntity } from './user.entity';
import { JobEntity } from './job.entity';

@Entity({ name: 'employer_profiles' })
export class EmployerProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => UserEntity, (u) => u.employerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'company_name', type: 'varchar', length: 512 })
  companyName!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  website?: string | null;

  /** Ключ логотипа компании в S3 (после presign) */
  @Column({ name: 'logo_storage_key', type: 'varchar', length: 2048, nullable: true })
  logoStorageKey?: string | null;

  /** Telegram chat_id для уведомлений о новых откликах */
  @Column({ name: 'telegram_chat_id', type: 'varchar', length: 64, nullable: true })
  telegramChatId?: string | null;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: EmployerVerificationStatus,
    default: EmployerVerificationStatus.PENDING,
  })
  verificationStatus!: EmployerVerificationStatus;

  @OneToMany(() => JobEntity, (j) => j.employerProfile)
  jobs?: JobEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
