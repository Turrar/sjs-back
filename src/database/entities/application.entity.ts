import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { UserEntity } from './user.entity';
import { JobEntity } from './job.entity';
import { StudentProfileEntity } from './student-profile.entity';
import { ChatRoomEntity } from './chat-room.entity';

@Entity({ name: 'applications' })
@Unique(['studentUserId', 'jobId'])
export class ApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'job_id', type: 'uuid' })
  jobId!: string;

  @ManyToOne(() => JobEntity, (j) => j.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: JobEntity;

  @Column({ name: 'student_user_id', type: 'uuid' })
  studentUserId!: string;

  @ManyToOne(() => UserEntity, (u) => u.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_user_id' })
  student!: UserEntity;

  @Column({ name: 'student_profile_id', type: 'uuid' })
  studentProfileId!: string;

  @ManyToOne(() => StudentProfileEntity, (p) => p.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfileEntity;

  @Column({ type: 'enum', enum: ApplicationStatus })
  status!: ApplicationStatus;

  @Column({ name: 'cover_letter', type: 'text', nullable: true })
  coverLetter?: string | null;

  /** 0–100; optional until AiModule scores */
  @Column({ name: 'employer_score', type: 'smallint', nullable: true })
  employerScore?: number | null;

  /** Daily.co room name (last segment of URL), set when employer opens video call. */
  @Column({ name: 'video_room_name', type: 'varchar', length: 128, nullable: true })
  videoRoomName?: string | null;

  /** Daily.co base room URL (without ?t= token), set when employer opens video call. */
  @Column({ name: 'video_room_url', type: 'varchar', length: 512, nullable: true })
  videoRoomUrl?: string | null;

  @OneToOne(() => ChatRoomEntity, (c) => c.application)
  chatRoom?: ChatRoomEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
