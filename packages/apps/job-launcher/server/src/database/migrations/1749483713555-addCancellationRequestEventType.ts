import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCancellationRequestEventType1749483713555
  implements MigrationInterface
{
  name = 'AddCancellationRequestEventType1749483713555';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_e834f9a1d4dc20775e2cb2319e"
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
                'abuse_detected',
                'escrow_canceled',
                'escrow_completed',
                'escrow_created',
                'escrow_failed'
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
            CREATE UNIQUE INDEX "IDX_e834f9a1d4dc20775e2cb2319e" ON "hmt"."webhook" (
                "chain_id",
                "escrow_address",
                "event_type",
                "oracle_address"
            )
        `);
  }
}
