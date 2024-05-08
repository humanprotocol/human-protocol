import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentInfo1712930098821 implements MigrationInterface {
  name = 'PaymentInfo1712930098821';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "hmt"."payments-info" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "customer_id" character varying NOT NULL,
                "payment_method_id" character varying NOT NULL,
                "user_id" integer NOT NULL,
                CONSTRAINT "PK_b4970c6db0e80ea900a06ebc171" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_35c9ce414705e7b718a58aa6f0" ON "hmt"."payments-info" ("customer_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_63719fa3540ac47f61cc4a7ba1" ON "hmt"."payments-info" ("user_id")
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
            ALTER TYPE "hmt"."payments_type_enum"
            RENAME TO "payments_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_type_enum" AS ENUM('DEPOSIT', 'REFUND', 'WITHDRAWAL', 'SLASH')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments"
            ALTER COLUMN "type" TYPE "hmt"."payments_type_enum" USING "type"::"text"::"hmt"."payments_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_type_enum_old"
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
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments-info"
            ADD CONSTRAINT "FK_63719fa3540ac47f61cc4a7ba11" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments-info" DROP CONSTRAINT "FK_63719fa3540ac47f61cc4a7ba11"
        `);
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_012a8481fc9980fcc49f3f0dc2"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum_old" AS ENUM(
                'create-escrow',
                'setup-escrow',
                'fund-escrow',
                'cancel-escrow',
                'process-pending-webhook'
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
            CREATE TYPE "hmt"."payments_type_enum_old" AS ENUM('DEPOSIT', 'REFUND', 'WITHDRAWAL')
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
            DROP INDEX "hmt"."IDX_63719fa3540ac47f61cc4a7ba1"
        `);
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_35c9ce414705e7b718a58aa6f0"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."payments-info"
        `);
  }
}
