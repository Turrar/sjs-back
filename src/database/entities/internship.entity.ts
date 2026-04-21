import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicationEntity } from './application.entity';
import { UserEntity } from './user.entity';

export enum InternshipStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Трекер стажировки — открывается после найма (HIRED статус заявки).
 * Ведёт журнал часов, задачи и итоговый отзыв работодателя.
 */
@Entity({ name: 'internships' })
export class InternshipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'application_id', type: 'uuid', unique: true })
  applicationId!: string;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application!: ApplicationEntity;

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

  @Column({ type: 'enum', enum: InternshipStatus, default: InternshipStatus.ACTIVE })
  status!: InternshipStatus;

  /** Итоговый отзыв работодателя о студенте */
  @Column({ name: 'employer_feedback', type: 'text', nullable: true })
  employerFeedback?: string | null;

  /** Итоговая оценка работодателя 1-5 */
  @Column({ name: 'employer_rating', type: 'smallint', nullable: true })
  employerRating?: number | null;

  @OneToMany(() => InternshipLogEntryEntity, (e) => e.internship, { cascade: true })
  logEntries?: InternshipLogEntryEntity[];

  @OneToMany(() => InternshipTaskEntity, (t) => t.internship, { cascade: true })
  tasks?: InternshipTaskEntity[];

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

/** Запись в журнале отработанных часов */
@Entity({ name: 'internship_log_entries' })
export class InternshipLogEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'internship_id', type: 'uuid' })
  internshipId!: string;

  @ManyToOne(() => InternshipEntity, (i) => i.logEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'internship_id' })
  internship!: InternshipEntity;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'float' })
  hours!: number;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

/** Задача в рамках стажировки */
@Entity({ name: 'internship_tasks' })
export class InternshipTaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'internship_id', type: 'uuid' })
  internshipId!: string;

  @ManyToOne(() => InternshipEntity, (i) => i.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'internship_id' })
  internship!: InternshipEntity;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status!: TaskStatus;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
