import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobStatus } from '../../common/enums/job-status.enum';
import { UserEntity } from './user.entity';
import { EmployerProfileEntity } from './employer-profile.entity';
import { ApplicationEntity } from './application.entity';
import { CityEntity } from './city.entity';
import { JobCategoryEntity } from './job-category.entity';
import { TagEntity } from './tag.entity';

/**
 * Work windows required by the employer (minutes from midnight, day 0–6).
 * Stored as JSONB; matches AiModule / schedule compatibility spec.
 */
export type JobWorkWindowJson = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

@Entity({ name: 'jobs' })
export class JobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employer_profile_id', type: 'uuid' })
  employerProfileId!: string;

  @ManyToOne(() => EmployerProfileEntity, (e) => e.jobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employer_profile_id' })
  employerProfile!: EmployerProfileEntity;

  /** Denormalized for queries; must match employer user id */
  @Column({ name: 'employer_user_id', type: 'uuid' })
  employerUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employer_user_id' })
  employerUser!: UserEntity;

  @Column({ type: 'varchar', length: 512 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status!: JobStatus;

  @Column({ type: 'varchar', length: 512, nullable: true })
  location?: string | null;

  @Column({ name: 'city_id', type: 'uuid', nullable: true })
  cityId?: string | null;

  @ManyToOne(() => CityEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'city_id' })
  city?: CityEntity | null;

  @ManyToMany(() => JobCategoryEntity)
  @JoinTable({
    name: 'job_job_categories',
    joinColumn: { name: 'job_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'job_category_id', referencedColumnName: 'id' },
  })
  categories?: JobCategoryEntity[];

  @ManyToMany(() => TagEntity)
  @JoinTable({
    name: 'job_tags',
    joinColumn: { name: 'job_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags?: TagEntity[];

  @Column({ name: 'salary_min', type: 'int', nullable: true })
  salaryMin?: number | null;

  @Column({ name: 'salary_max', type: 'int', nullable: true })
  salaryMax?: number | null;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  /** Minimum hours per week the role expects */
  @Column({ name: 'required_weekly_hours', type: 'float', nullable: true })
  requiredWeeklyHours?: number | null;

  @Column({ name: 'work_windows', type: 'jsonb', nullable: true })
  workWindows?: JobWorkWindowJson[] | null;

  /** Поднятая в выдаче вакансия (промо) */
  @Column({ name: 'is_premium', type: 'boolean', default: false })
  isPremium!: boolean;

  /**
   * Источник вакансии: 'manual' — создана работодателем в системе,
   * 'hh' — импортирована с HH.kz/HH.ru.
   */
  @Column({ type: 'varchar', length: 32, default: 'manual' })
  source!: string;

  /** Внешний ID вакансии (например, ID на HH.kz) для дедупликации */
  @Column({ name: 'external_id', type: 'varchar', length: 128, nullable: true, unique: false })
  externalId?: string | null;

  @OneToMany(() => ApplicationEntity, (a) => a.job)
  applications?: ApplicationEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
