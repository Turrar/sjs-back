import { MigrationInterface, QueryRunner } from 'typeorm';

export class CatalogCitiesCategoriesTags1735300000000
  implements MigrationInterface
{
  name = 'CatalogCitiesCategoriesTags1735300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(200) NOT NULL,
        "slug" character varying(200),
        "image_storage_key" character varying(2048),
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_cities_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_cities" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(200) NOT NULL,
        "slug" character varying(200) NOT NULL,
        "parent_id" uuid,
        "image_storage_key" character varying(2048),
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_job_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_job_categories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_job_categories_parent" FOREIGN KEY ("parent_id") REFERENCES "job_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tags" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tags_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_tags" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "city_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "category_id" uuid
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_city" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_category" FOREIGN KEY ("category_id") REFERENCES "job_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_tags" (
        "job_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL,
        CONSTRAINT "PK_job_tags" PRIMARY KEY ("job_id", "tag_id"),
        CONSTRAINT "FK_job_tags_job" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_job_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "job_tags"`);
    await queryRunner.query(`
      ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "FK_jobs_category"
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "FK_jobs_city"
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs" DROP COLUMN IF EXISTS "category_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs" DROP COLUMN IF EXISTS "city_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cities"`);
  }
}
