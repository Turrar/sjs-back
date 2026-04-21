import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityEmbeddingEntity } from '../../database/entities';
import { EmbeddingOpenAiService } from './embedding-openai.service';
import { hashEmbeddingSource } from './embedding-hash.util';

/**
 * Persists embeddings with content hash so stale vectors are recomputed when source text changes.
 */
@Injectable()
export class EmbeddingVectorStorageService {
  constructor(
    @InjectRepository(EntityEmbeddingEntity)
    private readonly repo: Repository<EntityEmbeddingEntity>,
    private readonly openAi: EmbeddingOpenAiService,
  ) {}

  /** Queue worker: replace or delete row for this entity. */
  async syncFromText(
    target: string,
    entityId: string,
    text: string,
  ): Promise<void> {
    const t = text.trim();
    if (!t) {
      await this.repo.delete({ target, entityId });
      return;
    }
    if (!this.openAi.isEnabled()) {
      return;
    }
    const vector = await this.openAi.embedDocument(t);
    const sourceHash = hashEmbeddingSource(t);
    await this.upsertVector(target, entityId, vector, sourceHash);
  }

  /** Scoring: reuse cache only when hash matches current text. */
  async getOrComputeVector(
    target: string,
    entityId: string,
    text: string,
  ): Promise<number[]> {
    const t = text.trim();
    if (!t) {
      throw new Error('Empty text for embedding');
    }
    if (!this.openAi.isEnabled()) {
      throw new Error('OpenAI embeddings are not configured');
    }
    const sourceHash = hashEmbeddingSource(t);
    const row = await this.repo.findOne({ where: { target, entityId } });
    if (row?.embedding?.length && row.sourceHash === sourceHash) {
      return row.embedding;
    }
    const vector = await this.openAi.embedDocument(t);
    await this.upsertVector(target, entityId, vector, sourceHash);
    return vector;
  }

  private async upsertVector(
    target: string,
    entityId: string,
    vector: number[],
    sourceHash: string,
  ): Promise<void> {
    const existing = await this.repo.findOne({ where: { target, entityId } });
    if (existing) {
      existing.embedding = vector;
      existing.dimensions = vector.length;
      existing.sourceHash = sourceHash;
      await this.repo.save(existing);
    } else {
      await this.repo.save(
        this.repo.create({
          target,
          entityId,
          embedding: vector,
          dimensions: vector.length,
          sourceHash,
        }),
      );
    }
  }
}
