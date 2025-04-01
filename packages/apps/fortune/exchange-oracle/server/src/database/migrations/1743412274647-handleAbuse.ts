import { MigrationInterface, QueryRunner } from 'typeorm';

export class HandleAbuse1743412274647 implements MigrationInterface {
  name = 'HandleAbuse1743412274647';

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
                'abuse_dismissed'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhooks"
            ALTER COLUMN "event_type" TYPE "hmt"."webhooks_event_type_enum" USING "event_type"::"text"::"hmt"."webhooks_event_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhooks_event_type_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM('active', 'paused', 'completed', 'canceled')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum" USING "status"::"text"::"hmt"."jobs_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum_old" AS ENUM('active', 'completed', 'canceled')
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
            CREATE TYPE "hmt"."webhooks_event_type_enum_old" AS ENUM(
                'escrow_created',
                'escrow_completed',
                'escrow_canceled',
                'escrow_failed',
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
