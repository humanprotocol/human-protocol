import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentModerationRequests1741358054378
  implements MigrationInterface
{
  name = 'AddContentModerationRequests1741358054378';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."content-moderation-requests_status_enum" AS ENUM(
                'pending',
                'processed',
                'positive_abuse',
                'passed',
                'failed'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "hmt"."content-moderation-requests" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "data_url" character varying NOT NULL,
                "from" integer NOT NULL,
                "to" integer NOT NULL,
                "status" "hmt"."content-moderation-requests_status_enum" NOT NULL,
                "job_id" integer NOT NULL,
                CONSTRAINT "PK_e81154211cbfb9f8dcd56158313" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM(
                'pending',
                'paid',
                'under_moderation',
                'moderation_passed',
                'possible_abuse_in_review',
                'created',
                'funded',
                'launched',
                'partial',
                'completed',
                'failed',
                'to_cancel',
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
            ALTER TABLE "hmt"."content-moderation-requests"
            ADD CONSTRAINT "FK_d4f313caf54945a83b00abc02af" FOREIGN KEY ("job_id") REFERENCES "hmt"."jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."content-moderation-requests" DROP CONSTRAINT "FK_d4f313caf54945a83b00abc02af"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum_old" AS ENUM(
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
            CREATE TYPE "hmt"."jobs_status_enum_old" AS ENUM(
                'pending',
                'paid',
                'created',
                'funded',
                'launched',
                'partial',
                'completed',
                'failed',
                'to_cancel',
                'canceled'
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
    await queryRunner.query(`
            DROP TABLE "hmt"."content-moderation-requests"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."content-moderation-requests_status_enum"
        `);
  }
}
