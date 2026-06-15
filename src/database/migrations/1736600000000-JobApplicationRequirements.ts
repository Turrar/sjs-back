import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobApplicationRequirements1736600000000 implements MigrationInterface {
  name = 'JobApplicationRequirements1736600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD COLUMN IF NOT EXISTS "requires_resume" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD COLUMN IF NOT EXISTS "requires_cover_letter" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "applications"
      ADD COLUMN IF NOT EXISTS "resume_draft_id" uuid
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_applications_resume_draft'
        ) THEN
          ALTER TABLE "applications"
          ADD CONSTRAINT "FK_applications_resume_draft"
          FOREIGN KEY ("resume_draft_id") REFERENCES "resume_drafts"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_applications_resume_draft_id"
      ON "applications" ("resume_draft_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_applications_resume_draft_id"`);
    await queryRunner.query(`
      ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "FK_applications_resume_draft"
    `);
    await queryRunner.query(`
      ALTER TABLE "applications" DROP COLUMN IF EXISTS "resume_draft_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs" DROP COLUMN IF EXISTS "requires_cover_letter"
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs" DROP COLUMN IF EXISTS "requires_resume"
    `);
  }
}
