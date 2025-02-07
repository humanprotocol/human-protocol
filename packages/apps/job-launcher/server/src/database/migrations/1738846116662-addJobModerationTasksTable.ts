import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobModerationTasksTable1738846116662
  implements MigrationInterface
{
  name = 'AddJobModerationTasksTable1738846116662';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."job-moderation-tasks" DROP COLUMN "failed_reason"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."job-moderation-tasks"
            ADD "abuse_reason" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."job-moderation-tasks" DROP CONSTRAINT "FK_1535881c834d1151b4b27d3fe6f"
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
            ALTER TABLE "hmt"."job-moderation-tasks"
            ALTER COLUMN "job_id" DROP NOT NULL
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
    await queryRunner.query(`
            ALTER TABLE "hmt"."job-moderation-tasks"
            ADD CONSTRAINT "FK_1535881c834d1151b4b27d3fe6f" FOREIGN KEY ("job_id") REFERENCES "hmt"."jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."job-moderation-tasks" DROP CONSTRAINT "FK_1535881c834d1151b4b27d3fe6f"
        `);
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
            ALTER TABLE "hmt"."job-moderation-tasks"
            ALTER COLUMN "job_id"
            SET NOT NULL
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
            ADD CONSTRAINT "FK_1535881c834d1151b4b27d3fe6f" FOREIGN KEY ("job_id") REFERENCES "hmt"."jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."job-moderation-tasks" DROP COLUMN "abuse_reason"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."job-moderation-tasks"
            ADD "failed_reason" character varying
        `);
  }
}
