import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWebhookTable1701702644318 implements MigrationInterface {
    name = 'AddWebhookTable1701702644318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_event_type_enum" AS ENUM(
                'escrow_created',
                'escrow_canceled',
                'task_creation_failed'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_oracle_type_enum" AS ENUM('fortune', 'cvat')
        `);
        await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED')
        `);
        await queryRunner.query(`
            CREATE TABLE "hmt"."webhook" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "chain_id" integer NOT NULL,
                "escrow_address" character varying NOT NULL,
                "event_type" "hmt"."webhook_event_type_enum" NOT NULL,
                "oracle_type" "hmt"."webhook_oracle_type_enum" NOT NULL,
                "has_signature" boolean NOT NULL,
                "retries_count" integer NOT NULL,
                "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL,
                "status" "hmt"."webhook_status_enum" NOT NULL,
                CONSTRAINT "PK_e6765510c2d078db49632b59020" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_7449312cababf4bb89c681e986" ON "hmt"."webhook" ("chain_id", "escrow_address")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "hmt"."IDX_7449312cababf4bb89c681e986"
        `);
        await queryRunner.query(`
            DROP TABLE "hmt"."webhook"
        `);
        await queryRunner.query(`
            DROP TYPE "hmt"."webhook_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "hmt"."webhook_oracle_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "hmt"."webhook_event_type_enum"
        `);
    }

}
