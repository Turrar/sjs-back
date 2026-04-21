import { MigrationInterface, QueryRunner } from 'typeorm';

export class CatalogNameI18n1735700000000 implements MigrationInterface {
  name = 'CatalogNameI18n1735700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cities"
      ADD COLUMN IF NOT EXISTS "name_i18n" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "job_categories"
      ADD COLUMN IF NOT EXISTS "name_i18n" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "tags"
      ADD COLUMN IF NOT EXISTS "name_i18n" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN IF EXISTS "name_i18n"`);
    await queryRunner.query(
      `ALTER TABLE "job_categories" DROP COLUMN IF EXISTS "name_i18n"`,
    );
    await queryRunner.query(`ALTER TABLE "cities" DROP COLUMN IF EXISTS "name_i18n"`);
  }
}
