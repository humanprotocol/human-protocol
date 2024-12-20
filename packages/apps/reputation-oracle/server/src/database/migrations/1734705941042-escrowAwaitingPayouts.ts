import { MigrationInterface, QueryRunner } from 'typeorm';

export class EscrowAwaitingPayouts1734705941042 implements MigrationInterface {
  name = 'EscrowAwaitingPayouts1734705941042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hmt"."escrow_payouts_batch" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "escrow_completion_tracking_id" integer NOT NULL, "payouts" json NOT NULL, "payouts_hash" character varying NOT NULL, "tx_hash" character varying, "tx_nonce" integer, CONSTRAINT "PK_6eb1d2e51d7c024fc681dfa67a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_44fd0222c43ed95845dd718f2a" ON "hmt"."escrow_payouts_batch" ("escrow_completion_tracking_id", "payouts_hash") `,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum" RENAME TO "cron-jobs_cron_job_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM('process-pending-incoming-webhook', 'process-pending-outgoing-webhook', 'process-pending-escrow-completion-tracking', 'process-paid-escrow-completion-tracking', 'process-awaiting-escrow-payouts')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."cron-jobs" ALTER COLUMN "cron_job_type" TYPE "hmt"."cron-jobs_cron_job_type_enum" USING "cron_job_type"::"text"::"hmt"."cron-jobs_cron_job_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "hmt"."cron-jobs_cron_job_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."escrow_completion_tracking_status_enum" RENAME TO "escrow_completion_tracking_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."escrow_completion_tracking_status_enum" AS ENUM('pending', 'awaiting_payouts', 'paid', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."escrow_completion_tracking" ALTER COLUMN "status" TYPE "hmt"."escrow_completion_tracking_status_enum" USING "status"::"text"::"hmt"."escrow_completion_tracking_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "hmt"."escrow_completion_tracking_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."escrow_payouts_batch" ADD CONSTRAINT "FK_e0c93d91e0edd3becc3c84ed0a0" FOREIGN KEY ("escrow_completion_tracking_id") REFERENCES "hmt"."escrow_completion_tracking"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."escrow_payouts_batch" DROP CONSTRAINT "FK_e0c93d91e0edd3becc3c84ed0a0"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."escrow_completion_tracking_status_enum_old" AS ENUM('pending', 'paid', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."escrow_completion_tracking" ALTER COLUMN "status" TYPE "hmt"."escrow_completion_tracking_status_enum_old" USING "status"::"text"::"hmt"."escrow_completion_tracking_status_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "hmt"."escrow_completion_tracking_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."escrow_completion_tracking_status_enum_old" RENAME TO "escrow_completion_tracking_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum_old" AS ENUM('process-pending-incoming-webhook', 'process-pending-outgoing-webhook', 'process-pending-escrow-completion-tracking', 'process-paid-escrow-completion-tracking')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."cron-jobs" ALTER COLUMN "cron_job_type" TYPE "hmt"."cron-jobs_cron_job_type_enum_old" USING "cron_job_type"::"text"::"hmt"."cron-jobs_cron_job_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."cron-jobs_cron_job_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum_old" RENAME TO "cron-jobs_cron_job_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_44fd0222c43ed95845dd718f2a"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."escrow_payouts_batch"`);
  }
}
