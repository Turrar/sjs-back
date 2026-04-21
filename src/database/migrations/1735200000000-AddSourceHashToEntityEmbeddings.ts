import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSourceHashToEntityEmbeddings1735200000000 implements MigrationInterface {
  name = 'AddSourceHashToEntityEmbeddings1735200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "entity_embeddings"
      ADD COLUMN IF NOT EXISTS "source_hash" character varying(64) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "entity_embeddings" DROP COLUMN IF EXISTS "source_hash"
    `);
  }
}
