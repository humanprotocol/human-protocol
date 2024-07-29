import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEscrowCompletedEventTypeToWebhookTable1720453476309
  implements MigrationInterface
{
  name = 'AddEscrowCompletedEventTypeToWebhookTable1720453476309';

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
                'task_creation_failed',
                'submission_rejected',
                'submission_in_review'
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
                'escrow_canceled',
                'task_creation_failed',
                'submission_rejected',
                'submission_in_review'
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
