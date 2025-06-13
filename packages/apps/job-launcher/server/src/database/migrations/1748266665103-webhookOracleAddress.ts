import { MigrationInterface, QueryRunner } from 'typeorm';

export class WebhookOracleAddress1748266665103 implements MigrationInterface {
  name = 'WebhookOracleAddress1748266665103';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook"
            ADD "oracle_address" character varying
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM(
                'paid',
                'under_moderation',
                'moderation_passed',
                'possible_abuse_in_review',
                'created',
                'funded',
                'launched',
                'partial',
                'completed',
                'failed',
                'to_cancel',
                'canceling',
                'canceled'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum" USING "status"::"text"::"hmt"."jobs_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum_old"
        `);
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_012a8481fc9980fcc49f3f0dc2"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e834f9a1d4dc20775e2cb2319e" ON "hmt"."webhook" (
                "chain_id",
                "escrow_address",
                "event_type",
                "oracle_address"
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum_old" AS ENUM(
                'paid',
                'under_moderation',
                'moderation_passed',
                'possible_abuse_in_review',
                'created',
                'funded',
                'launched',
                'partial',
                'completed',
                'failed',
                'to_cancel',
                'canceled'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum_old" USING "status"::"text"::"hmt"."jobs_status_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum_old"
            RENAME TO "jobs_status_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook" DROP COLUMN "oracle_address"
        `);
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_e834f9a1d4dc20775e2cb2319e"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_012a8481fc9980fcc49f3f0dc2" ON "hmt"."webhook" ("chain_id", "escrow_address", "event_type")
        `);
  }
}
