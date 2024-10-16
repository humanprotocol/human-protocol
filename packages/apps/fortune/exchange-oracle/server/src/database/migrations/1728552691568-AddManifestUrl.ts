import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManifestUrl1728552691568 implements MigrationInterface {
  name = 'AddManifestUrl1728552691568';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ADD "manifest_url" character varying
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" DROP COLUMN "manifest_url"
        `);
  }
}
