import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOracleAddress1712220998800 implements MigrationInterface {
  name = 'RemoveOracleAddress1712220998800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."webhook_incoming" DROP COLUMN "oracle_address"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."webhook_incoming" ADD "oracle_address" character varying`,
    );
  }
}
