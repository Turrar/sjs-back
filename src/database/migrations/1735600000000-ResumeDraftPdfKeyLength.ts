import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResumeDraftPdfKeyLength1735600000000
  implements MigrationInterface
{
  name = 'ResumeDraftPdfKeyLength1735600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resume_drafts"
      ALTER COLUMN "pdf_storage_key" TYPE character varying(2048)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resume_drafts"
      ALTER COLUMN "pdf_storage_key" TYPE character varying(1024)
    `);
  }
}
