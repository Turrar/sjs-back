import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint2Features1735900000000 implements MigrationInterface {
  name = 'Sprint2Features1735900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Job Alerts
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_alerts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "student_user_id" uuid NOT NULL,
        "city_id" uuid,
        "category_id" uuid,
        "tag_ids" jsonb,
        "q" character varying(200),
        "is_active" boolean NOT NULL DEFAULT true,
        "last_notified_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_job_alerts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_job_alerts_student" FOREIGN KEY ("student_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Employer Reviews
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employer_reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "student_user_id" uuid NOT NULL,
        "employer_user_id" uuid NOT NULL,
        "rating" smallint NOT NULL,
        "comment" text,
        "is_anonymous" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employer_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_employer_reviews_student_employer" UNIQUE ("student_user_id", "employer_user_id"),
        CONSTRAINT "FK_employer_reviews_student" FOREIGN KEY ("student_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_employer_reviews_employer" FOREIGN KEY ("employer_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // GitHub username + Telegram chat_id для студента
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
        ADD COLUMN IF NOT EXISTS "github_username" character varying(128),
        ADD COLUMN IF NOT EXISTS "telegram_chat_id" character varying(64)
    `);

    // Telegram chat_id для работодателя
    await queryRunner.query(`
      ALTER TABLE "employer_profiles"
        ADD COLUMN IF NOT EXISTS "telegram_chat_id" character varying(64)
    `);

    // Добавляем тип уведомления JOB_ALERT в enum (если не существует)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'notifications_kind_enum'
            AND e.enumlabel = 'JOB_ALERT'
        ) THEN
          ALTER TYPE "notifications_kind_enum" ADD VALUE 'JOB_ALERT';
        END IF;
      END$$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "job_alerts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employer_reviews"`);
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
        DROP COLUMN IF EXISTS "github_username",
        DROP COLUMN IF EXISTS "telegram_chat_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "employer_profiles"
        DROP COLUMN IF EXISTS "telegram_chat_id"
    `);
  }
}
