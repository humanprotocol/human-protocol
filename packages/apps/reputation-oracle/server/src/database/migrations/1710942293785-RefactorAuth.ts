import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorAuth1710942293785 implements MigrationInterface {
  name = 'RefactorAuth1710942293785';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hmt"."auths" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "access_token" character varying NOT NULL, "refresh_token" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "REL_593ea7ee438b323776029d3185" UNIQUE ("user_id"), CONSTRAINT "PK_22fc0631a651972ddc9c5a31090" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."tokens_type_enum" AS ENUM('EMAIL', 'PASSWORD', 'REFRESH')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."tokens" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "hmt"."tokens_type_enum" NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_57b0dd7af7c6a0b7d4c3fd5c464" UNIQUE ("uuid"), CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_306030d9411d291750fd115857" ON "hmt"."tokens" ("type", "user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."kycs_status_enum" AS ENUM('NONE', 'APPROVED', 'SUBMISSION_REQUIRED', 'RESUBMISSION_REQUIRED', 'REJECTED', 'PENDING_VERIFICATION', 'RESET')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."kycs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "session_id" character varying NOT NULL, "status" "hmt"."kycs_status_enum" NOT NULL DEFAULT 'NONE', "message" character varying, "user_id" integer NOT NULL, CONSTRAINT "UQ_76ea5d4f1a010a5fe4949771f4c" UNIQUE ("session_id"), CONSTRAINT "REL_bbfe1fa864841e82cff1be09e8" UNIQUE ("user_id"), CONSTRAINT "PK_6f4a4d2b94576014ab3d5e77694" PRIMARY KEY ("id", "session_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_type_enum" AS ENUM('OPERATOR', 'EXCHANGE_ORACLE', 'RECORDING_ORACLE', 'WORKER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "password" character varying, "email" character varying, "type" "hmt"."users_type_enum" NOT NULL, "evm_address" character varying, "nonce" character varying, "status" "hmt"."users_status_enum" NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_6009c050ae797d7e13ba0b0759b" UNIQUE ("evm_address"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."reputation_type_enum" AS ENUM('WORKER', 'JOB_LAUNCHER', 'EXCHANGE_ORACLE', 'RECORDING_ORACLE', 'REPUTATION_ORACLE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."reputation" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "address" character varying NOT NULL, "reputation_points" integer NOT NULL, "type" "hmt"."reputation_type_enum" NOT NULL, CONSTRAINT "PK_640807583e8622e1d9bbe6f1b7b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."webhook_incoming_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'PAID')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."webhook_incoming" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "oracle_address" character varying, "escrow_address" character varying NOT NULL, "results_url" character varying, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."webhook_incoming_status_enum" NOT NULL, CONSTRAINT "PK_08e16abccb4720323203bf8f7a0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ed1eb73afbf214f9bd4c2d03f4" ON "hmt"."webhook_incoming" ("chain_id", "escrow_address") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM('process-pending-webhook', 'process-paid-webhook')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."cron-jobs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "cron_job_type" "hmt"."cron-jobs_cron_job_type_enum" NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "completed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_268498ac0d3e7472960fb0faeb1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0dafd70b737e71d21490ad0126" ON "hmt"."cron-jobs" ("cron_job_type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."api_keys" ("id" SERIAL NOT NULL, "hashed_api_key" character varying NOT NULL, "salt" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "REL_a3baee01d8408cd3c0f89a9a97" UNIQUE ("user_id"), CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."auths" ADD CONSTRAINT "FK_593ea7ee438b323776029d3185f" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ADD CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."api_keys" ADD CONSTRAINT "FK_a3baee01d8408cd3c0f89a9a973" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."api_keys" DROP CONSTRAINT "FK_a3baee01d8408cd3c0f89a9a973"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" DROP CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."auths" DROP CONSTRAINT "FK_593ea7ee438b323776029d3185f"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."api_keys"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_0dafd70b737e71d21490ad0126"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."cron-jobs"`);
    await queryRunner.query(`DROP TYPE "hmt"."cron-jobs_cron_job_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_ed1eb73afbf214f9bd4c2d03f4"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."webhook_incoming"`);
    await queryRunner.query(`DROP TYPE "hmt"."webhook_incoming_status_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."reputation"`);
    await queryRunner.query(`DROP TYPE "hmt"."reputation_type_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."users"`);
    await queryRunner.query(`DROP TYPE "hmt"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "hmt"."users_type_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."kycs"`);
    await queryRunner.query(`DROP TYPE "hmt"."kycs_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_306030d9411d291750fd115857"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."tokens"`);
    await queryRunner.query(`DROP TYPE "hmt"."tokens_type_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."auths"`);
  }
}
