import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWebhookTableAndAddCronJobEnumValue1729230039842
  implements MigrationInterface
{
  name = 'UpdateWebhookTableAndAddCronJobEnumValue1729230039842';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."webhook_type_enum" AS ENUM('in', 'out')`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."webhook_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'PAID')`,
    );

    // Create the new webhook table
    await queryRunner.query(`
            CREATE TABLE "hmt"."webhook" (
                "id" SERIAL NOT NULL, 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
                "chain_id" integer NOT NULL, 
                "escrow_address" character varying NOT NULL, 
                "results_url" character varying, 
                "callback_url" character varying, 
                "type" "hmt"."webhook_type_enum" NOT NULL, 
                "failed_reason" character varying, 
                "retries_count" integer NOT NULL, 
                "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, 
                "status" "hmt"."webhook_status_enum" NOT NULL, 
                CONSTRAINT "PK_e6765510c2d078db49632b59020" PRIMARY KEY ("id")
            )
        `);

    // Migrate existing data from webhook_incoming to webhook
    await queryRunner.query(`
            INSERT INTO "hmt"."webhook" ("created_at", "updated_at", "chain_id", "escrow_address", "results_url", "callback_url", "type", "failed_reason", "retries_count", "wait_until", "status")
            SELECT 
                "created_at", 
                "updated_at", 
                "chain_id", 
                "escrow_address", 
                "results_url", 
                NULL AS "callback_url",
                'in'::"hmt"."webhook_type_enum" AS "type",
                NULL AS "failed_reason",
                "retries_count", 
                "wait_until", 
                CASE "status" 
                    WHEN 'PENDING' THEN 'PENDING'::"hmt"."webhook_status_enum"
                    WHEN 'COMPLETED' THEN 'COMPLETED'::"hmt"."webhook_status_enum"
                    WHEN 'FAILED' THEN 'FAILED'::"hmt"."webhook_status_enum"
                    WHEN 'PAID' THEN 'PAID'::"hmt"."webhook_status_enum"
                    ELSE 'PENDING'
                END AS "status" 
            FROM "hmt"."webhook_incoming"
        `);

    await queryRunner.query(`DROP TABLE IF EXISTS "hmt"."webhook_incoming"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "hmt"."webhook_incoming_status_enum"`,
    );

    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_7943bffa727aafee3c8a4fc849" 
            ON "hmt"."webhook" ("chain_id", "escrow_address", "type", "callback_url")
        `);

    await queryRunner.query(
      `ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum" RENAME TO "cron-jobs_cron_job_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM('process-pending-webhook', 'process-paid-webhook', 'process-outgoing-webhook')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."cron-jobs" ALTER COLUMN "cron_job_type" TYPE "hmt"."cron-jobs_cron_job_type_enum" USING "cron_job_type"::"text"::"hmt"."cron-jobs_cron_job_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "hmt"."cron-jobs_cron_job_type_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
      `CREATE TYPE "hmt"."webhook_incoming_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'PAID')`,
    );

    await queryRunner.query(`
            CREATE TABLE "hmt"."webhook_incoming" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "chain_id" integer NOT NULL,
                "escrow_address" character varying NOT NULL,
                "results_url" character varying,
                "retries_count" integer NOT NULL,
                "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL,
                "status" "hmt"."webhook_incoming_status_enum" NOT NULL,  -- Changed to ENUM type
                CONSTRAINT "PK_webhook_incoming" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            INSERT INTO "hmt"."webhook_incoming" ("created_at", "updated_at", "chain_id", "escrow_address", "results_url", "retries_count", "wait_until", "status")
            SELECT 
                "created_at", 
                "updated_at", 
                "chain_id", 
                "escrow_address", 
                "results_url", 
                "retries_count", 
                "wait_until", 
                CASE "status"
                    WHEN 'PENDING' THEN 'PENDING'::"hmt"."webhook_incoming_status_enum"
                    WHEN 'COMPLETED' THEN 'COMPLETED'::"hmt"."webhook_incoming_status_enum"
                    WHEN 'FAILED' THEN 'FAILED'::"hmt"."webhook_incoming_status_enum"
                    WHEN 'PAID' THEN 'PAID'::"hmt"."webhook_incoming_status_enum"
                    ELSE 'PENDING'::"hmt"."webhook_incoming_status_enum"
                END AS "status" 
            FROM "hmt"."webhook"
        `);

    await queryRunner.query(`DROP TABLE "hmt"."webhook"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "hmt"."webhook_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "hmt"."webhook_status_enum"`);
  }
}
