import { MigrationInterface, QueryRunner } from 'typeorm';

export class Abuse1713367468270 implements MigrationInterface {
  name = 'Abuse1713367468270';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."abuses_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'NOTIFIED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."abuses_decision_enum" AS ENUM('REJECTED', 'ACCEPTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."abuses" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "escrow_address" character varying NOT NULL, "status" "hmt"."abuses_status_enum" NOT NULL, "decision" "hmt"."abuses_decision_enum", "user_id" integer NOT NULL, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_8cfbf5b6d26e83e4fd5955c8c8b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_023d33d90733aa64f612995657" ON "hmt"."abuses" ("chain_id", "escrow_address") `,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum" RENAME TO "cron-jobs_cron_job_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM('process-pending-webhook', 'process-paid-webhook', 'process-requested-abuse', 'process-classified-abuse')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."cron-jobs" ALTER COLUMN "cron_job_type" TYPE "hmt"."cron-jobs_cron_job_type_enum" USING "cron_job_type"::"text"::"hmt"."cron-jobs_cron_job_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "hmt"."cron-jobs_cron_job_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."abuses" ADD CONSTRAINT "FK_8136cf4f4cef59bdb54d17c714d" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."abuses" DROP CONSTRAINT "FK_8136cf4f4cef59bdb54d17c714d"`,
    );
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
      `DROP INDEX "hmt"."IDX_023d33d90733aa64f612995657"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."abuses"`);
    await queryRunner.query(`DROP TYPE "hmt"."abuses_decision_enum"`);
    await queryRunner.query(`DROP TYPE "hmt"."abuses_status_enum"`);
  }
}
