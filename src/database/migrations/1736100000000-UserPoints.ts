import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserPoints1736100000000 implements MigrationInterface {
  name = 'UserPoints1736100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "user_points_event_enum" AS ENUM (
        'PROFILE_COMPLETED',
        'FIRST_APPLICATION',
        'FIRST_HIRE',
        'RESUME_CREATED',
        'SCHEDULE_UPLOADED',
        'REVIEW_WRITTEN',
        'GITHUB_LINKED',
        'TELEGRAM_LINKED',
        'SKILL_TEST_PASSED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_points" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "event" "user_points_event_enum" NOT NULL,
        "points" integer NOT NULL,
        "meta" jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_points" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_points_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_points_user_id" ON "user_points" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_points"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_points_event_enum"`);
  }
}
