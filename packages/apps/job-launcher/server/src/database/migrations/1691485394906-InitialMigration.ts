import { MigrationInterface, QueryRunner } from 'typeorm';
import { NS } from '../../common/constants';

export class InitialMigration1691485394906 implements MigrationInterface {
  name = 'InitialMigration1691485394906';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(NS, true);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_type_enum" AS ENUM('DEPOSIT', 'REFUND', 'WITHDRAWAL')
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_source_enum" AS ENUM('FIAT', 'CRYPTO', 'BALANCE')
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_status_enum" AS ENUM('PENDING', 'FAILED', 'SUCCEEDED')
        `);
    await queryRunner.query(`
            CREATE TABLE "hmt"."payments" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "transaction" character varying,
                "chain_id" integer,
                "amount" numeric(30, 18) NOT NULL,
                "rate" numeric(30, 18) NOT NULL,
                "currency" character varying NOT NULL,
                "type" "hmt"."payments_type_enum" NOT NULL,
                "source" "hmt"."payments_source_enum" NOT NULL,
                "status" "hmt"."payments_status_enum" NOT NULL,
                "user_id" integer NOT NULL,
                "job_id" integer,
                CONSTRAINT "REL_f83af8ea8055b85bde0e095e40" UNIQUE ("job_id"),
                CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_72b30c486884d4c5be768e0ac9" ON "hmt"."payments" ("transaction")
            WHERE (
                    chain_Id IS NULL
                    AND transaction IS NOT NULL
                )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_9b5d72797ec3ba4991cba5de4c" ON "hmt"."payments" ("chain_id", "transaction")
            WHERE (
                    chain_Id IS NOT NULL
                    AND transaction IS NOT NULL
                )
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM(
                'PENDING',
                'PAID',
                'LAUNCHED',
                'FAILED',
                'TO_CANCEL',
                'CANCELED'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "hmt"."jobs" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "chain_id" integer,
                "escrow_address" character varying,
                "fee" numeric(30, 18) NOT NULL,
                "fund_amount" numeric(30, 18) NOT NULL,
                "manifest_url" character varying NOT NULL,
                "manifest_hash" character varying NOT NULL,
                "status" "hmt"."jobs_status_enum" NOT NULL,
                "user_id" integer NOT NULL,
                "retries_count" integer NOT NULL DEFAULT '0',
                "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_59f6c552b618c432f019500e7c" ON "hmt"."jobs" ("chain_id", "escrow_address")
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."tokens_token_type_enum" AS ENUM('EMAIL', 'PASSWORD')
        `);
    await queryRunner.query(`
            CREATE TABLE "hmt"."tokens" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "token_type" "hmt"."tokens_token_type_enum" NOT NULL,
                "user_id" integer NOT NULL,
                CONSTRAINT "UQ_57b0dd7af7c6a0b7d4c3fd5c464" UNIQUE ("uuid"),
                CONSTRAINT "REL_8769073e38c365f315426554ca" UNIQUE ("user_id"),
                CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."users_type_enum" AS ENUM('OPERATOR', 'REQUESTER')
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING')
        `);
    await queryRunner.query(`
            CREATE TABLE "hmt"."users" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "password" character varying NOT NULL,
                "email" character varying,
                "type" "hmt"."users_type_enum" NOT NULL,
                "status" "hmt"."users_status_enum" NOT NULL,
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "hmt"."auths" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "access_token" character varying NOT NULL,
                "refresh_token" character varying NOT NULL,
                "user_id" integer NOT NULL,
                CONSTRAINT "REL_593ea7ee438b323776029d3185" UNIQUE ("user_id"),
                CONSTRAINT "PK_22fc0631a651972ddc9c5a31090" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments"
            ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ADD CONSTRAINT "FK_9027c8f0ba75fbc1ac46647d043" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments"
            ADD CONSTRAINT "FK_f83af8ea8055b85bde0e095e400" FOREIGN KEY ("job_id") REFERENCES "hmt"."jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
            ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths"
            ADD CONSTRAINT "FK_593ea7ee438b323776029d3185f" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths" DROP CONSTRAINT "FK_593ea7ee438b323776029d3185f"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" DROP CONSTRAINT "FK_9027c8f0ba75fbc1ac46647d043"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments" DROP CONSTRAINT "FK_f83af8ea8055b85bde0e095e400"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."auths"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."users"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."users_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."users_type_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."tokens"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."tokens_token_type_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_59f6c552b618c432f019500e7c"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."jobs"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_9b5d72797ec3ba4991cba5de4c"
        `);
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_72b30c486884d4c5be768e0ac9"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."payments"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_source_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_type_enum"
        `);
    await queryRunner.dropSchema(NS);
  }
}
