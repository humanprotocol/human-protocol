import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApiKeyMigration1701687554619 implements MigrationInterface {
    name = 'CreateApiKeyMigration1701687554619'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "hmt"."api_keys" (
                "id" SERIAL NOT NULL,
                "hashed_api_key" character varying NOT NULL,
                "salt" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "update_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" integer,
                CONSTRAINT "REL_a3baee01d8408cd3c0f89a9a97" UNIQUE ("user_id"),
                CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id")
            )
        `);
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
        await queryRunner.query(`
            ALTER TABLE "hmt"."api_keys"
            ADD CONSTRAINT "FK_a3baee01d8408cd3c0f89a9a973" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hmt"."api_keys" DROP CONSTRAINT "FK_a3baee01d8408cd3c0f89a9a973"
        `);
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
        await queryRunner.query(`
            DROP TABLE "hmt"."api_keys"
        `);
    }

}
