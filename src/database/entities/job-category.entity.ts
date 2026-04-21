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
import type { NameI18n } from '../../common/types/name-i18n.type';

@Entity({ name: 'job_categories' })
export class JobCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ name: 'name_i18n', type: 'jsonb', nullable: true })
  nameI18n?: NameI18n | null;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug!: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string | null;

  @ManyToOne(() => JobCategoryEntity, (c) => c.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: JobCategoryEntity | null;

  @OneToMany(() => JobCategoryEntity, (c) => c.parent)
  children?: JobCategoryEntity[];

  @Column({ name: 'image_storage_key', type: 'varchar', length: 2048, nullable: true })
  imageStorageKey?: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
