import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobSource1736000000000 implements MigrationInterface {
  name = 'JobSource1736000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs"
        ADD COLUMN IF NOT EXISTS "source" character varying(32) NOT NULL DEFAULT 'manual',
        ADD COLUMN IF NOT EXISTS "external_id" character varying(128)
    `);

    // Уникальный индекс для дедупликации при импорте
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_jobs_source_external_id"
        ON "jobs" ("source", "external_id")
        WHERE "external_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_jobs_source_external_id"`);
    await queryRunner.query(`
      ALTER TABLE "jobs"
        DROP COLUMN IF EXISTS "source",
        DROP COLUMN IF EXISTS "external_id"
    `);
  }
}
