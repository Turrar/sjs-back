import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApplicationVideoRoom1736400000000 implements MigrationInterface {
  name = 'ApplicationVideoRoom1736400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "applications"
        ADD COLUMN IF NOT EXISTS "video_room_name" character varying(128),
        ADD COLUMN IF NOT EXISTS "video_room_url"  character varying(512)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "applications"
        DROP COLUMN IF EXISTS "video_room_name",
        DROP COLUMN IF EXISTS "video_room_url"
    `);
  }
}
