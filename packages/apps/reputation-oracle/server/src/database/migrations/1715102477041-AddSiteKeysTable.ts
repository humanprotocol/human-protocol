import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSiteKeysTable1715102477041 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "hmt"."site_keys" (
                id SERIAL PRIMARY KEY,
                site_key VARCHAR UNIQUE NOT NULL,
                user_id INTEGER REFERENCES "hmt"."users"(id)
            );
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."site_keys"
            ADD COLUMN site_key_id INTEGER,
            ADD CONSTRAINT FK_site_key_id FOREIGN KEY (site_key_id) REFERENCES site_keys(id);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."site_keys"
            DROP COLUMN site_key_id,
            DROP CONSTRAINT FK_site_key_id;
        `);

    await queryRunner.query(`
            DROP TABLE "hmt"."site_keys";
        `);
  }
}
