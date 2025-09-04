import { MigrationInterface, QueryRunner } from 'typeorm';

export class EscrowCancellation1754660427175 implements MigrationInterface {
  name = 'EscrowCancellation1754660427175';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhooks_event_type_enum"
            RENAME TO "webhooks_event_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhooks_event_type_enum" AS ENUM(
                'escrow_created',
                'escrow_completed',
                'escrow_canceled',
                'escrow_failed',
                'submission_rejected',
                'submission_in_review',
                'abuse_detected',
                'abuse_dismissed',
                'cancellation_requested'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhooks"
            ALTER COLUMN "event_type" TYPE "hmt"."webhooks_event_type_enum" USING "event_type"::"text"::"hmt"."webhooks_event_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhooks_event_type_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhooks_event_type_enum_old" AS ENUM(
                'escrow_created',
                'escrow_completed',
                'escrow_canceled',
                'escrow_failed',
                'submission_rejected',
                'submission_in_review',
                'abuse_detected',
                'abuse_dismissed'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhooks"
            ALTER COLUMN "event_type" TYPE "hmt"."webhooks_event_type_enum_old" USING "event_type"::"text"::"hmt"."webhooks_event_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhooks_event_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhooks_event_type_enum_old"
            RENAME TO "webhooks_event_type_enum"
        `);
  }
}
