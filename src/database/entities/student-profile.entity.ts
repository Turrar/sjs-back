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
import { UserEntity } from './user.entity';
import { ApplicationEntity } from './application.entity';
import { ScheduleSourceEntity } from './schedule-source.entity';
import { ScheduleSlotEntity } from './schedule-slot.entity';

@Entity({ name: 'student_profiles' })
export class StudentProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => UserEntity, (u) => u.studentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'first_name', type: 'varchar', length: 255, nullable: true })
  firstName?: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 255, nullable: true })
  lastName?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  university?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  specialty?: string | null;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  @Column({
    name: 'portfolio_url',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  portfolioUrl?: string | null;

  /** Ключ объекта фото профиля в S3 (после presign) */
  @Column({ name: 'avatar_storage_key', type: 'varchar', length: 2048, nullable: true })
  avatarStorageKey?: string | null;

  /** IANA timezone for schedule / job matching */
  @Column({ type: 'varchar', length: 128, default: 'UTC' })
  timezone!: string;

  /** GitHub username для отображения репозиториев в профиле */
  @Column({ name: 'github_username', type: 'varchar', length: 128, nullable: true })
  githubUsername?: string | null;

  /** Telegram chat_id для push-уведомлений через бота */
  @Column({ name: 'telegram_chat_id', type: 'varchar', length: 64, nullable: true })
  telegramChatId?: string | null;

  @OneToMany(() => ApplicationEntity, (a) => a.studentProfile)
  applications?: ApplicationEntity[];

  @OneToMany(() => ScheduleSourceEntity, (s) => s.studentProfile)
  scheduleSources?: ScheduleSourceEntity[];

  @OneToMany(() => ScheduleSlotEntity, (s) => s.studentProfile)
  scheduleSlots?: ScheduleSlotEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
