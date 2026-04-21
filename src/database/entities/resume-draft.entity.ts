import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudentProfileEntity } from './student-profile.entity';

@Entity({ name: 'resume_drafts' })
export class ResumeDraftEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'student_profile_id', type: 'uuid' })
  studentProfileId!: string;

  @ManyToOne(() => StudentProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfileEntity;

  @Column({ type: 'varchar', length: 512, nullable: true })
  title?: string | null;

  @Column({ name: 'content_json', type: 'jsonb' })
  contentJson!: Record<string, unknown>;

  /** Ключ загруженного PDF в S3 (после POST /upload/presign) */
  @Column({
    name: 'pdf_storage_key',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  pdfStorageKey?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
