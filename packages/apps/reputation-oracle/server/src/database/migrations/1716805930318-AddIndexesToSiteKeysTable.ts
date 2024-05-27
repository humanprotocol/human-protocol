import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesToSiteKeysTable1716805930318
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_031d62ae4b47ae1a15c3d68179" ON "hmt"."site_keys" ("site_key", "type")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_031d62ae4b47ae1a15c3d68179"
        `);
  }
}
