import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDbTtlCronJob1747301407259 implements MigrationInterface {
  name = 'AddDbTtlCronJob1747301407259';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum" RENAME TO "cron-jobs_cron_job_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM('process-pending-incoming-webhook', 'process-pending-outgoing-webhook', 'process-pending-escrow-completion-tracking', 'process-paid-escrow-completion-tracking', 'process-awaiting-escrow-payouts', 'process-requested-abuse', 'process-classified-abuse', 'delete-expired-database-records')`,
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
      `CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum_old" AS ENUM('process-pending-incoming-webhook', 'process-pending-outgoing-webhook', 'process-pending-escrow-completion-tracking', 'process-paid-escrow-completion-tracking', 'process-awaiting-escrow-payouts', 'process-requested-abuse', 'process-classified-abuse')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."cron-jobs" ALTER COLUMN "cron_job_type" TYPE "hmt"."cron-jobs_cron_job_type_enum_old" USING "cron_job_type"::"text"::"hmt"."cron-jobs_cron_job_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."cron-jobs_cron_job_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum_old" RENAME TO "cron-jobs_cron_job_type_enum"`,
    );
  }
}
