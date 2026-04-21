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
import { ScheduleParseStatus } from '../../common/enums/schedule-parse-status.enum';
import { StudentProfileEntity } from './student-profile.entity';
import { ScheduleSlotEntity } from './schedule-slot.entity';

@Entity({ name: 'schedule_sources' })
export class ScheduleSourceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_profile_id', type: 'uuid' })
  studentProfileId!: string;

  @ManyToOne(() => StudentProfileEntity, (s) => s.scheduleSources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfileEntity;

  @Column({ name: 'storage_key', type: 'varchar', length: 2048 })
  storageKey!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 255 })
  mimeType!: string;

  @Column({
    name: 'parse_status',
    type: 'enum',
    enum: ScheduleParseStatus,
    default: ScheduleParseStatus.PENDING,
  })
  parseStatus!: ScheduleParseStatus;

  @Column({ name: 'raw_ai_json', type: 'jsonb', nullable: true })
  rawAiJson?: Record<string, unknown> | null;

  @OneToMany(() => ScheduleSlotEntity, (s) => s.scheduleSource)
  slots?: ScheduleSlotEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
