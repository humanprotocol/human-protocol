import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveNullableFromJobEntity1748612934037
  implements MigrationInterface
{
  name = 'RemoveNullableFromJobEntity1748612934037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_59f6c552b618c432f019500e7c"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "chain_id"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "reputation_oracle"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "exchange_oracle"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "recording_oracle"
            SET NOT NULL
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_59f6c552b618c432f019500e7c" ON "hmt"."jobs" ("chain_id", "escrow_address")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_59f6c552b618c432f019500e7c"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "recording_oracle" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "exchange_oracle" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "reputation_oracle" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "chain_id" DROP NOT NULL
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_59f6c552b618c432f019500e7c" ON "hmt"."jobs" ("chain_id", "escrow_address")
        `);
  }
}
