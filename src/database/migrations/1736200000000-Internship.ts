import { MigrationInterface, QueryRunner } from 'typeorm';

export class Internship1736200000000 implements MigrationInterface {
  name = 'Internship1736200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "internship_status_enum" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "internship_task_status_enum" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "internships" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "application_id" uuid NOT NULL UNIQUE,
        "student_user_id" uuid NOT NULL,
        "employer_user_id" uuid NOT NULL,
        "status" "internship_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "employer_feedback" text,
        "employer_rating" smallint,
        "started_at" TIMESTAMPTZ,
        "ended_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_internships" PRIMARY KEY ("id"),
        CONSTRAINT "FK_internships_application" FOREIGN KEY ("application_id")
          REFERENCES "applications"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_internships_student" FOREIGN KEY ("student_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_internships_employer" FOREIGN KEY ("employer_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "internship_log_entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "internship_id" uuid NOT NULL,
        "date" date NOT NULL,
        "hours" float NOT NULL,
        "description" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_internship_log_entries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_log_entries_internship" FOREIGN KEY ("internship_id")
          REFERENCES "internships"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "internship_tasks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "internship_id" uuid NOT NULL,
        "title" character varying(500) NOT NULL,
        "description" text,
        "status" "internship_task_status_enum" NOT NULL DEFAULT 'TODO',
        "due_date" date,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_internship_tasks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tasks_internship" FOREIGN KEY ("internship_id")
          REFERENCES "internships"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "internship_tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "internship_log_entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "internships"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "internship_task_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "internship_status_enum"`);
  }
}
