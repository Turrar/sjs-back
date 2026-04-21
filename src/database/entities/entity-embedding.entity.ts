import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/** Matches EmbeddingTarget in ai-contracts */
@Entity({ name: 'entity_embeddings' })
@Unique('uq_entity_embeddings_target_entity', ['target', 'entityId'])
@Index('idx_entity_embeddings_target', ['target'])
export class EntityEmbeddingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  target!: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId!: string;

  /** Embedding vector as JSON array (same semantics as pgvector for app-layer cosine). */
  @Column({ type: 'jsonb' })
  embedding!: number[];

  @Column({ type: 'smallint' })
  dimensions!: number;

  /** SHA-256 of source text used to build the embedding (cache invalidation). */
  @Column({ name: 'source_hash', type: 'varchar', length: 64, nullable: true })
  sourceHash?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
