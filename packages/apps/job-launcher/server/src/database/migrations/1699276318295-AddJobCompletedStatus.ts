import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobCompletedStatus1699276318295 implements MigrationInterface {
    name = 'AddJobCompletedStatus1699276318295'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM(
                'PENDING',
                'PAID',
                'LAUNCHED',
                'COMPLETED',
                'FAILED',
                'TO_CANCEL',
                'CANCELED'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum" USING "status"::"text"::"hmt"."jobs_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum_old"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum_old" AS ENUM(
                'PENDING',
                'PAID',
                'LAUNCHED',
                'FAILED',
                'TO_CANCEL',
                'CANCELED'
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
