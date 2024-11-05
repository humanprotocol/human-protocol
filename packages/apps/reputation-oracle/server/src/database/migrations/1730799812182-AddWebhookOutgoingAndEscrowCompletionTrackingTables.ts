import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebhookOutgoingAndEscrowCompletionTrackingTables1730799812182
  implements MigrationInterface
{
  name = 'AddWebhookOutgoingAndEscrowCompletionTrackingTables1730799812182';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."webhook_incoming" RENAME COLUMN "results_url" TO "failed_reason"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."webhook_outgoing_status_enum" AS ENUM('pending', 'sent', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."webhook_outgoing" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "payload" jsonb NOT NULL, "hash" character varying NOT NULL, "url" character varying NOT NULL, "failed_reason" character varying, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."webhook_outgoing_status_enum" NOT NULL, CONSTRAINT "PK_d232b33ccee326e251936e16c5f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d33daa25634fccb127ead889d4" ON "hmt"."webhook_outgoing" ("hash") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."escrow_completion_tracking_status_enum" AS ENUM('pending', 'paid', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."escrow_completion_tracking" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "escrow_address" character varying NOT NULL, "final_results_url" character varying, "final_results_hash" character varying, "failed_reason" character varying, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."escrow_completion_tracking_status_enum" NOT NULL, CONSTRAINT "PK_a6abebca3ce8e49155aaf14ccc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_146945054beb996cfe6edf1789" ON "hmt"."escrow_completion_tracking" ("chain_id", "escrow_address") `,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."webhook_incoming_status_enum" RENAME TO "webhook_incoming_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."webhook_incoming_status_enum" AS ENUM('pending', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."webhook_incoming" ALTER COLUMN "status" TYPE "hmt"."webhook_incoming_status_enum" USING "status"::"text"::"hmt"."webhook_incoming_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "hmt"."webhook_incoming_status_enum_old"`,
    );
    await queryRunner.query(`DELETE FROM "hmt"."cron-jobs"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum" RENAME TO "cron-jobs_cron_job_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM('process-pending-incoming-webhook', 'process-pending-outgoing-webhook', 'process-pending-escrow-completion-tracking', 'process-paid-escrow-completion-tracking')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."cron-jobs" ALTER COLUMN "cron_job_type" TYPE "hmt"."cron-jobs_cron_job_type_enum" USING "cron_job_type"::"text"::"hmt"."cron-jobs_cron_job_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "hmt"."cron-jobs_cron_job_type_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "hmt"."cron-jobs"`);
    await queryRunner.query(
      `CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum_old" AS ENUM('process-pending-webhook', 'process-paid-webhook')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."cron-jobs" ALTER COLUMN "cron_job_type" TYPE "hmt"."cron-jobs_cron_job_type_enum_old" USING "cron_job_type"::"text"::"hmt"."cron-jobs_cron_job_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."cron-jobs_cron_job_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum_old" RENAME TO "cron-jobs_cron_job_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."webhook_incoming_status_enum_old" AS ENUM('pending', 'completed', 'failed', 'paid')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."webhook_incoming" ALTER COLUMN "status" TYPE "hmt"."webhook_incoming_status_enum_old" USING "status"::"text"::"hmt"."webhook_incoming_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."webhook_incoming_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."webhook_incoming_status_enum_old" RENAME TO "webhook_incoming_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_146945054beb996cfe6edf1789"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."escrow_completion_tracking"`);
    await queryRunner.query(
      `DROP TYPE "hmt"."escrow_completion_tracking_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_d33daa25634fccb127ead889d4"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."webhook_outgoing"`);
    await queryRunner.query(`DROP TYPE "hmt"."webhook_outgoing_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "hmt"."webhook_incoming" RENAME COLUMN "failed_reason" TO "results_url"`,
    );
  }
}
