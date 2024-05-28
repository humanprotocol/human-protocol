import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSiteKeysTable1715102477041 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."site_keys_type_enum" AS ENUM('fortune', 'cvat', 'hcaptcha')`,
    );

    await queryRunner.query(`
        CREATE TABLE "hmt"."site_keys" (
            id SERIAL PRIMARY KEY,
            site_key VARCHAR UNIQUE NOT NULL,
            type "hmt"."site_keys_type_enum" NOT NULL,
            user_id INTEGER UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "FK_178ba06ffb4808dbb40e782231e" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_031d62ae4b47ae1a15c3d68179" ON "hmt"."site_keys" ("site_key", "type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP INDEX "hmt"."IDX_031d62ae4b47ae1a15c3d68179"
      `);

    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "FK_178ba06ffb4808dbb40e782231e"`,
    );

    await queryRunner.query(`
        DROP TABLE "hmt"."site_keys";
      `);

    await queryRunner.query(`DROP TYPE "hmt"."site_keys_type_enum"`);
  }
}
