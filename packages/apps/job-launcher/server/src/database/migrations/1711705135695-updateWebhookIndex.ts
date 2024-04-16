import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWebhookIndex1711705135695 implements MigrationInterface {
  name = 'UpdateWebhookIndex1711705135695';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_7449312cababf4bb89c681e986"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_012a8481fc9980fcc49f3f0dc2" ON "hmt"."webhook" ("chain_id", "escrow_address", "event_type")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_012a8481fc9980fcc49f3f0dc2"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_7449312cababf4bb89c681e986" ON "hmt"."webhook" ("chain_id", "escrow_address")
        `);
  }
}
