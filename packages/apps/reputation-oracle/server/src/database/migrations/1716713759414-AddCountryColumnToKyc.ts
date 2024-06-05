import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCountryColumnToKyc1716713759414 implements MigrationInterface {
  name = 'AddCountryColumnToKyc1716713759414';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ADD "country" character varying NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hmt"."kycs" DROP COLUMN "country"`);
  }
}
