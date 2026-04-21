import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

/** Тип события, за которое начисляются очки */
export enum PointEventType {
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
  FIRST_APPLICATION = 'FIRST_APPLICATION',
  FIRST_HIRE = 'FIRST_HIRE',
  RESUME_CREATED = 'RESUME_CREATED',
  SCHEDULE_UPLOADED = 'SCHEDULE_UPLOADED',
  REVIEW_WRITTEN = 'REVIEW_WRITTEN',
  GITHUB_LINKED = 'GITHUB_LINKED',
  TELEGRAM_LINKED = 'TELEGRAM_LINKED',
  SKILL_TEST_PASSED = 'SKILL_TEST_PASSED',
}

/** Количество очков за каждое событие */
export const POINT_VALUES: Record<PointEventType, number> = {
  [PointEventType.PROFILE_COMPLETED]: 50,
  [PointEventType.FIRST_APPLICATION]: 20,
  [PointEventType.FIRST_HIRE]: 100,
  [PointEventType.RESUME_CREATED]: 30,
  [PointEventType.SCHEDULE_UPLOADED]: 20,
  [PointEventType.REVIEW_WRITTEN]: 15,
  [PointEventType.GITHUB_LINKED]: 10,
  [PointEventType.TELEGRAM_LINKED]: 10,
  [PointEventType.SKILL_TEST_PASSED]: 25,
};

/**
 * Лог начислений очков (append-only).
 * Итого = SUM(points) по userId.
 */
@Entity({ name: 'user_points' })
export class UserPointsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'enum', enum: PointEventType })
  event!: PointEventType;

  @Column({ type: 'int' })
  points!: number;

  /** Доп. контекст (например, id навыкового теста) */
  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
