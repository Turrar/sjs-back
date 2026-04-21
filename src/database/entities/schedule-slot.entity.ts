import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StudentProfileEntity } from './student-profile.entity';
import { ScheduleSourceEntity } from './schedule-source.entity';

/**
 * Busy intervals (classes) on a weekly template. Student free time is the complement
 * within each day; see ScheduleCompatibilityService.
 */
@Entity({ name: 'schedule_slots' })
export class ScheduleSlotEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_profile_id', type: 'uuid' })
  studentProfileId!: string;

  @ManyToOne(() => StudentProfileEntity, (s) => s.scheduleSlots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfileEntity;

  @Column({ name: 'schedule_source_id', type: 'uuid', nullable: true })
  scheduleSourceId?: string | null;

  @ManyToOne(() => ScheduleSourceEntity, (s) => s.slots, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'schedule_source_id' })
  scheduleSource?: ScheduleSourceEntity | null;

  /** 0 = Monday … 6 = Sunday (ISO weekday aligned with plan) */
  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek!: number;

  /** Minutes from midnight [0, 1440) */
  @Column({ name: 'start_minute', type: 'int' })
  startMinute!: number;

  @Column({ name: 'end_minute', type: 'int' })
  endMinute!: number;

  @Column({ type: 'varchar', length: 512, nullable: true })
  label?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
