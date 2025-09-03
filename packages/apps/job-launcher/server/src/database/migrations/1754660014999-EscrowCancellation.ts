import { MigrationInterface, QueryRunner } from 'typeorm';

export class EscrowCancellation1754660014999 implements MigrationInterface {
  name = 'EscrowCancellation1754660014999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_012a8481fc9980fcc49f3f0dc2"
        `);
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
            ALTER TYPE "hmt"."webhook_event_type_enum"
            RENAME TO "webhook_event_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_event_type_enum" AS ENUM(
                'escrow_created',
                'escrow_canceled',
                'escrow_completed',
                'escrow_failed',
                'abuse_detected',
                'cancellation_requested'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook"
            ALTER COLUMN "event_type" TYPE "hmt"."webhook_event_type_enum" USING "event_type"::"text"::"hmt"."webhook_event_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_event_type_enum_old"
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
            DROP INDEX "hmt"."IDX_e834f9a1d4dc20775e2cb2319e"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_event_type_enum_old" AS ENUM(
                'escrow_created',
                'escrow_canceled',
                'escrow_completed',
                'escrow_failed',
                'abuse_detected'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook"
            ALTER COLUMN "event_type" TYPE "hmt"."webhook_event_type_enum_old" USING "event_type"::"text"::"hmt"."webhook_event_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_event_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhook_event_type_enum_old"
            RENAME TO "webhook_event_type_enum"
        `);
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
            CREATE UNIQUE INDEX "IDX_012a8481fc9980fcc49f3f0dc2" ON "hmt"."webhook" ("chain_id", "escrow_address", "event_type")
        `);
  }
}
