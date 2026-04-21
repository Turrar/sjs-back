import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { NameI18n } from '../../common/types/name-i18n.type';

@Entity({ name: 'cities' })
export class CityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ name: 'name_i18n', type: 'jsonb', nullable: true })
  nameI18n?: NameI18n | null;

  @Column({ type: 'varchar', length: 200, unique: true, nullable: true })
  slug?: string | null;

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
