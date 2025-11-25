import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnusedTypes1763628908882 implements MigrationInterface {
  name = 'RemoveUnusedTypes1763628908882';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM "hmt"."cron-jobs"
            WHERE "cron_job_type" IN ('setup-escrow', 'fund-escrow')
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM(
                'paid',
                'under_moderation',
                'moderation_passed',
                'possible_abuse_in_review',
                'launched',
                'partial',
                'completed',
                'failed',
                'to_cancel',
                'canceling',
                'canceled'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum" USING "status"::"text"::"hmt"."jobs_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum"
            RENAME TO "cron-jobs_cron_job_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM(
                'content-moderation',
                'create-escrow',
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
                'abuse',
                'cancel-escrow',
                'content-moderation',
                'create-escrow',
                'fund-escrow',
                'process-pending-webhook',
                'setup-escrow',
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
            CREATE TYPE "hmt"."jobs_status_enum_old" AS ENUM(
                'canceled',
                'canceling',
                'completed',
                'created',
                'failed',
                'funded',
                'launched',
                'moderation_passed',
                'paid',
                'partial',
                'possible_abuse_in_review',
                'to_cancel',
                'under_moderation'
            )
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
  }
}
