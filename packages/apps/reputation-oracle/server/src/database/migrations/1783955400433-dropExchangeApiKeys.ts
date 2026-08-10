import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropExchangeApiKeys1783955400433 implements MigrationInterface {
  name = 'DropExchangeApiKeys1783955400433';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."exchange_api_keys" DROP CONSTRAINT "FK_96ee74195b058a1b55afc49f673"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_96ee74195b058a1b55afc49f67"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."exchange_api_keys"`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // noop
  }
}
