import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * Анонимный отзыв студента о работодателе (Glassdoor-стиль для КЗ).
 * Один студент — один отзыв на одного работодателя.
 */
@Entity({ name: 'employer_reviews' })
@Unique(['studentUserId', 'employerUserId'])
export class EmployerReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_user_id', type: 'uuid' })
  studentUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_user_id' })
  studentUser!: UserEntity;

  @Column({ name: 'employer_user_id', type: 'uuid' })
  employerUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employer_user_id' })
  employerUser!: UserEntity;

  /** 1–5 */
  @Column({ type: 'smallint' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  /** true — скрываем имя и профиль студента в публичном ответе */
  @Column({ name: 'is_anonymous', type: 'boolean', default: true })
  isAnonymous!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
