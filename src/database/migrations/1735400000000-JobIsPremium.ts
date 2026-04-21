import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobIsPremium1735400000000 implements MigrationInterface {
  name = 'JobIsPremium1735400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD COLUMN IF NOT EXISTS "is_premium" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs" DROP COLUMN IF EXISTS "is_premium"
    `);
  }
}
