import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProfileAvatarLogo1735500000000 implements MigrationInterface {
  name = 'ProfileAvatarLogo1735500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_profiles"
      ADD COLUMN IF NOT EXISTS "avatar_storage_key" character varying(2048)
    `);
    await queryRunner.query(`
      ALTER TABLE "employer_profiles"
      ADD COLUMN IF NOT EXISTS "logo_storage_key" character varying(2048)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "employer_profiles" DROP COLUMN IF EXISTS "logo_storage_key"
    `);
    await queryRunner.query(`
      ALTER TABLE "student_profiles" DROP COLUMN IF EXISTS "avatar_storage_key"
    `);
  }
}
