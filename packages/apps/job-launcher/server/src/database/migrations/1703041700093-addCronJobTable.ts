import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCronJobTable1703041700093 implements MigrationInterface {
  name = 'AddCronJobTable1703041700093';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM('create-escrow', 'setup-escrow', 'fund-escrow')
        `);
    await queryRunner.query(`
            CREATE TABLE "hmt"."cron-jobs" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "cron_job_type" "hmt"."cron-jobs_cron_job_type_enum" NOT NULL,
                "completed_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_268498ac0d3e7472960fb0faeb1" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_cbeaa1214c9d7e29820b0cc758" ON "hmt"."cron-jobs" ("cron_job_type", "created_at")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_cbeaa1214c9d7e29820b0cc758"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."cron-jobs"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."cron-jobs_cron_job_type_enum"
        `);
  }
}
