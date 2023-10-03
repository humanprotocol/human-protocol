import { MigrationInterface, QueryRunner } from "typeorm"

export class AddFailedReasonToJobs1696331060184 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ADD COLUMN failedReason character varying;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            DROP COLUMN failedReason;
        `);
    }

}
