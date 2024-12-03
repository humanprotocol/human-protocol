import { MigrationInterface, QueryRunner } from 'typeorm';

export class NullableSiteKey1721994760450 implements MigrationInterface {
  name = 'NullableSiteKey1721994760450';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_2dcfd04b329a0fd4be7f376512"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2dcfd04b329a0fd4be7f376512" ON "hmt"."site_keys" ("user_id") WHERE (type = 'hcaptcha'::hmt.site_keys_type_enum)`,
    );
  }
}
