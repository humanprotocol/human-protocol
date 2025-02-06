import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobModerationTasksTable1738832293165
  implements MigrationInterface
{
  name = 'AddJobModerationTasksTable1738832293165';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."job-moderation-tasks"
                RENAME COLUMN "failed_reason" TO "abuse_reason"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."job-moderation-tasks_status_enum"
            RENAME TO "job-moderation-tasks_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."job-moderation-tasks_status_enum" AS ENUM(
                'pending',
                'processed',
                'possible_abuse',
                'positive_abuse',
                'passed',
                'failed'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."job-moderation-tasks"
            ALTER COLUMN "status" TYPE "hmt"."job-moderation-tasks_status_enum" USING "status"::"text"::"hmt"."job-moderation-tasks_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."job-moderation-tasks_status_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum"
            RENAME TO "cron-jobs_cron_job_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM(
                'job-moderation',
                'process-job-moderation-tasks',
                'parse-job-moderation-results',
                'complete-job-moderation',
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum_old" AS ENUM(
                'job-moderation',
                'process-job-moderation-tasks',
                'parse-job-moderation-results',
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
            CREATE TYPE "hmt"."job-moderation-tasks_status_enum_old" AS ENUM('pending', 'failed', 'completed')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."job-moderation-tasks"
            ALTER COLUMN "status" TYPE "hmt"."job-moderation-tasks_status_enum_old" USING "status"::"text"::"hmt"."job-moderation-tasks_status_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."job-moderation-tasks_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."job-moderation-tasks_status_enum_old"
            RENAME TO "job-moderation-tasks_status_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."job-moderation-tasks"
                RENAME COLUMN "abuse_reason" TO "failed_reason"
        `);
  }
}
