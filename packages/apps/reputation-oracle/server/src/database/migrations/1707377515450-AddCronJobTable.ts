import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCronJobTable1707377515450 implements MigrationInterface {
  name = 'AddCronJobTable1707377515450';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM(
                'process-pending-webhook',
                'process-paid-webhook'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "hmt"."cron-jobs" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "cron_job_type" "hmt"."cron-jobs_cron_job_type_enum" NOT NULL,
                "started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "completed_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_268498ac0d3e7472960fb0faeb1" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_0dafd70b737e71d21490ad0126" ON "hmt"."cron-jobs" ("cron_job_type")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_0dafd70b737e71d21490ad0126"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."cron-jobs"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."cron-jobs_cron_job_type_enum"
        `);
  }
}
