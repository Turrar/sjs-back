import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobCategoriesManyToMany1735800000000 implements MigrationInterface {
  name = 'JobCategoriesManyToMany1735800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_job_categories" (
        "job_id" uuid NOT NULL,
        "job_category_id" uuid NOT NULL,
        CONSTRAINT "PK_job_job_categories" PRIMARY KEY ("job_id", "job_category_id"),
        CONSTRAINT "FK_job_job_categories_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_job_job_categories_category" FOREIGN KEY ("job_category_id") REFERENCES "job_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'category_id'
        ) THEN
          INSERT INTO "job_job_categories" ("job_id", "job_category_id")
          SELECT "id", "category_id" FROM "jobs" WHERE "category_id" IS NOT NULL
          ON CONFLICT DO NOTHING;
        END IF;
      END$$
    `);

    await queryRunner.query(`
      ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "FK_jobs_category"
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs" DROP COLUMN IF EXISTS "category_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "category_id" uuid
    `);
    await queryRunner.query(`
      UPDATE "jobs" j
      SET "category_id" = sub."job_category_id"
      FROM (
        SELECT DISTINCT ON ("job_id") "job_id", "job_category_id"
        FROM "job_job_categories"
        ORDER BY "job_id", "job_category_id"
      ) sub
      WHERE j."id" = sub."job_id"
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "jobs"
        ADD CONSTRAINT "FK_jobs_category" FOREIGN KEY ("category_id") REFERENCES "job_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_job_categories"`);
  }
}
