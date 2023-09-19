import { MigrationInterface, QueryRunner } from "typeorm"

export class DropUniqueConstraintAndAddToRefundToJobsStatusEnum1695105424558 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "hmt"."temp_jobs_status_enum" AS ENUM(
                'PENDING',
                'PAID',
                'LAUNCHED',
                'FAILED',
                'TO_CANCEL',
                'CANCELED',
                'TO_REFUND'
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" ALTER COLUMN "status" 
            TYPE "hmt"."temp_jobs_status_enum" 
            USING "status"::text::"hmt"."temp_jobs_status_enum"
        `);

        await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum"
        `);

        await queryRunner.query(`
            ALTER TYPE "hmt"."temp_jobs_status_enum" RENAME TO "jobs_status_enum"
        `);

        await queryRunner.query(`ALTER TABLE "hmt"."payments" DROP CONSTRAINT "REL_f83af8ea8055b85bde0e095e40"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hmt"."payments" ADD CONSTRAINT "REL_f83af8ea8055b85bde0e095e40" UNIQUE ("job_id")`);

        
        await queryRunner.query(`
            CREATE TYPE "hmt"."temp_jobs_status_enum" AS ENUM(
                'PENDING',
                'PAID',
                'LAUNCHED',
                'FAILED',
                'TO_CANCEL',
                'CANCELED'
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" ALTER COLUMN "status" 
            TYPE "hmt"."temp_jobs_status_enum" 
            USING "status"::text::"hmt"."temp_jobs_status_enum"
        `);

        await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum"
        `);

        await queryRunner.query(`
            ALTER TYPE "hmt"."temp_jobs_status_enum" RENAME TO "jobs_status_enum"
        `);
    }

}
