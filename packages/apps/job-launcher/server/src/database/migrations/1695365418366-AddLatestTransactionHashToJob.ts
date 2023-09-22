import { MigrationInterface, QueryRunner } from "typeorm"

export class AddLatestTransactionHashToJob1695365418366 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" 
            ADD COLUMN "latest_transaction_hash" character varying NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" 
            DROP COLUMN "latest_transaction_hash";
        `);
    }

}
