import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * Подписка студента на поток новых вакансий по фильтру.
 * При появлении подходящей вакансии студент получает in-app уведомление (и Telegram, если привязан).
 */
@Entity({ name: 'job_alerts' })
export class JobAlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_user_id', type: 'uuid' })
  studentUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_user_id' })
  studentUser!: UserEntity;

  /** Фильтры (все необязательны; null = без фильтра по полю) */
  @Column({ name: 'city_id', type: 'uuid', nullable: true })
  cityId?: string | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  tagIds?: string[] | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  q?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  /** Дата последней отправки уведомления (для дедупликации) */
  @Column({ name: 'last_notified_at', type: 'timestamptz', nullable: true })
  lastNotifiedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
