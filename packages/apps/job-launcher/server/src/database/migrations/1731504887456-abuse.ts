import { MigrationInterface, QueryRunner } from 'typeorm';

export class Abuse1731504887456 implements MigrationInterface {
  name = 'Abuse1731504887456';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ADD "stripe_customer_id" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ADD CONSTRAINT "UQ_5ffbe395603641c29e8ce9b4c97" UNIQUE ("stripe_customer_id")
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."payments_type_enum"
            RENAME TO "payments_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_type_enum" AS ENUM('deposit', 'refund', 'withdrawal', 'slash')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments"
            ALTER COLUMN "type" TYPE "hmt"."payments_type_enum" USING "type"::"text"::"hmt"."payments_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_type_enum_old"
        `);
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_012a8481fc9980fcc49f3f0dc2"
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
                'task_creation_failed',
                'escrow_failed',
                'abuse'
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
            ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum"
            RENAME TO "cron-jobs_cron_job_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM(
                'create-escrow',
                'setup-escrow',
                'fund-escrow',
                'cancel-escrow',
                'process-pending-webhook',
                'sync-job-statuses',
                'abuse'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."cron-jobs"
            ALTER COLUMN "cron_job_type" TYPE "hmt"."cron-jobs_cron_job_type_enum" USING "cron_job_type"::"text"::"hmt"."cron-jobs_cron_job_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."cron-jobs_cron_job_type_enum_old"
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
            CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum_old" AS ENUM(
                'create-escrow',
                'setup-escrow',
                'fund-escrow',
                'cancel-escrow',
                'process-pending-webhook',
                'sync-job-statuses'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."cron-jobs"
            ALTER COLUMN "cron_job_type" TYPE "hmt"."cron-jobs_cron_job_type_enum_old" USING "cron_job_type"::"text"::"hmt"."cron-jobs_cron_job_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."cron-jobs_cron_job_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum_old"
            RENAME TO "cron-jobs_cron_job_type_enum"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_event_type_enum_old" AS ENUM(
                'escrow_created',
                'escrow_canceled',
                'escrow_completed',
                'task_creation_failed',
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
            CREATE UNIQUE INDEX "IDX_012a8481fc9980fcc49f3f0dc2" ON "hmt"."webhook" ("chain_id", "escrow_address", "event_type")
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_type_enum_old" AS ENUM('deposit', 'refund', 'withdrawal')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments"
            ALTER COLUMN "type" TYPE "hmt"."payments_type_enum_old" USING "type"::"text"::"hmt"."payments_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."payments_type_enum_old"
            RENAME TO "payments_type_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."users" DROP CONSTRAINT "UQ_5ffbe395603641c29e8ce9b4c97"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."users" DROP COLUMN "stripe_customer_id"
        `);
  }
}
