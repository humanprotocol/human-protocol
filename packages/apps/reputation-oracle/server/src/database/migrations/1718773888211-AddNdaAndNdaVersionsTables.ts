import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNdaAndNdaVersionsTables1718773888211
  implements MigrationInterface
{
  name = 'AddNdaAndNdaVersionsTables1718773888211';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."nda_status_enum" AS ENUM('SIGNED', 'REJECTED')`,
    );

    await queryRunner.query(`
            CREATE TABLE "hmt"."nda_versions" (
                id SERIAL PRIMARY KEY,
                version VARCHAR NOT NULL,
                document_text TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_ndas_version" UNIQUE ("version")
            );
        `);

    await queryRunner.query(`
            CREATE TABLE "hmt"."ndas" (
                id SERIAL PRIMARY KEY,
                status "hmt"."nda_status_enum" NOT NULL DEFAULT 'SIGNED',
                user_id INTEGER NOT NULL,
                nda_version_id INTEGER NOT NULL,
                ip_address VARCHAR NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

    await queryRunner.query(
      `ALTER TABLE "hmt"."ndas" ADD CONSTRAINT "FK_178ba06ffb4808dbb40e782231f" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "hmt"."ndas" ADD CONSTRAINT "fk_nda_version" FOREIGN KEY ("nda_version_id") REFERENCES "hmt"."nda_versions"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_nda_versions_nda_id_version" ON "hmt"."nda_versions" ("id", "version")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_nda_versions_nda_id_version"
        `);

    await queryRunner.query(
      `ALTER TABLE "hmt"."ndas" DROP CONSTRAINT "fk_nda_version"`,
    );

    await queryRunner.query(
      `ALTER TABLE "hmt"."ndas" DROP CONSTRAINT "FK_178ba06ffb4808dbb40e782231f"`,
    );

    await queryRunner.query(`
            DROP TABLE "hmt"."ndas";
        `);

    await queryRunner.query(`
            DROP TABLE "hmt"."nda_versions";
        `);

    await queryRunner.query(`DROP TYPE "hmt"."nda_status_enum"`);
  }
}
