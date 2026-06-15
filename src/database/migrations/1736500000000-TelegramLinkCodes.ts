import { MigrationInterface, QueryRunner } from 'typeorm';

export class TelegramLinkCodes1736500000000 implements MigrationInterface {
  name = 'TelegramLinkCodes1736500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "telegram_link_codes" (
        "code" character varying(64) NOT NULL,
        "user_id" uuid NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_telegram_link_codes" PRIMARY KEY ("code"),
        CONSTRAINT "FK_telegram_link_codes_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_telegram_link_codes_user_id" ON "telegram_link_codes" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "telegram_link_codes"`);
  }
}
