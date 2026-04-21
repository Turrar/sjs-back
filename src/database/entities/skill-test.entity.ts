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
import { UserEntity } from './user.entity';

/** Набор тестовых вопросов по навыку */
@Entity({ name: 'skill_tests' })
export class SkillTestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Название навыка (JavaScript, Excel, Казахский язык и т.д.) */
  @Column({ type: 'varchar', length: 200 })
  skill!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  /** Минимальный % правильных ответов для получения бейджа */
  @Column({ name: 'pass_threshold', type: 'int', default: 70 })
  passThreshold!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => SkillTestQuestionEntity, (q) => q.test, { cascade: true })
  questions?: SkillTestQuestionEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

/** Вопрос с вариантами ответа */
@Entity({ name: 'skill_test_questions' })
export class SkillTestQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'test_id', type: 'uuid' })
  testId!: string;

  @ManyToOne(() => SkillTestEntity, (t) => t.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test!: SkillTestEntity;

  @Column({ type: 'text' })
  question!: string;

  /** Варианты ответа: [{ id: "a", text: "..." }, ...] */
  @Column({ type: 'jsonb' })
  options!: Array<{ id: string; text: string }>;

  /** ID правильного варианта */
  @Column({ name: 'correct_option_id', type: 'varchar', length: 10 })
  correctOptionId!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;
}

/** Результат прохождения теста студентом */
@Entity({ name: 'skill_test_results' })
export class SkillTestResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_user_id', type: 'uuid' })
  studentUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_user_id' })
  studentUser!: UserEntity;

  @Column({ name: 'test_id', type: 'uuid' })
  testId!: string;

  @ManyToOne(() => SkillTestEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test!: SkillTestEntity;

  /** Ответы: { questionId: selectedOptionId } */
  @Column({ type: 'jsonb' })
  answers!: Record<string, string>;

  @Column({ name: 'score_percent', type: 'int' })
  scorePercent!: number;

  @Column({ name: 'passed', type: 'boolean' })
  passed!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

/** Бейдж на профиле студента за пройденный тест */
@Entity({ name: 'skill_badges' })
export class SkillBadgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_user_id', type: 'uuid' })
  studentUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_user_id' })
  studentUser!: UserEntity;

  @Column({ name: 'test_id', type: 'uuid' })
  testId!: string;

  @ManyToOne(() => SkillTestEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test!: SkillTestEntity;

  @Column({ name: 'skill', type: 'varchar', length: 200 })
  skill!: string;

  @Column({ name: 'score_percent', type: 'int' })
  scorePercent!: number;

  @CreateDateColumn({ name: 'earned_at', type: 'timestamptz' })
  earnedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
