import { MigrationInterface, QueryRunner } from 'typeorm';

export class SkillTests1736300000000 implements MigrationInterface {
  name = 'SkillTests1736300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "skill_tests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "skill" character varying(200) NOT NULL,
        "description" text,
        "pass_threshold" integer NOT NULL DEFAULT 70,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_skill_tests" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "skill_test_questions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "test_id" uuid NOT NULL,
        "question" text NOT NULL,
        "options" jsonb NOT NULL,
        "correct_option_id" character varying(10) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_skill_test_questions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_questions_test" FOREIGN KEY ("test_id")
          REFERENCES "skill_tests"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "skill_test_results" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "student_user_id" uuid NOT NULL,
        "test_id" uuid NOT NULL,
        "answers" jsonb NOT NULL,
        "score_percent" integer NOT NULL,
        "passed" boolean NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_skill_test_results" PRIMARY KEY ("id"),
        CONSTRAINT "FK_results_student" FOREIGN KEY ("student_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_results_test" FOREIGN KEY ("test_id")
          REFERENCES "skill_tests"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "skill_badges" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "student_user_id" uuid NOT NULL,
        "test_id" uuid NOT NULL,
        "skill" character varying(200) NOT NULL,
        "score_percent" integer NOT NULL,
        "earned_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_skill_badges" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_skill_badges_student_test" UNIQUE ("student_user_id", "test_id"),
        CONSTRAINT "FK_badges_student" FOREIGN KEY ("student_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_badges_test" FOREIGN KEY ("test_id")
          REFERENCES "skill_tests"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "skill_badges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "skill_test_results"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "skill_test_questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "skill_tests"`);
  }
}
