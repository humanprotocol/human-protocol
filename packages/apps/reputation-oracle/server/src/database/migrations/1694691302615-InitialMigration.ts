import { NS } from '../../common/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1694776006387 implements MigrationInterface {
  name = 'InitialMigration1694776006387';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(NS, true);
    await queryRunner.query(
      `CREATE TYPE "hmt"."tokens_token_type_enum" AS ENUM('EMAIL', 'PASSWORD')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."tokens" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_type" "hmt"."tokens_token_type_enum" NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_57b0dd7af7c6a0b7d4c3fd5c464" UNIQUE ("uuid"), CONSTRAINT "REL_8769073e38c365f315426554ca" UNIQUE ("user_id"), CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_type_enum" AS ENUM('OPERATOR', 'REQUESTER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "password" character varying NOT NULL, "email" character varying, "type" "hmt"."users_type_enum" NOT NULL, "status" "hmt"."users_status_enum" NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."auths" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "access_token" character varying NOT NULL, "refresh_token" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "REL_593ea7ee438b323776029d3185" UNIQUE ("user_id"), CONSTRAINT "PK_22fc0631a651972ddc9c5a31090" PRIMARY KEY ("id"))`,
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
      `CREATE TABLE "hmt"."webhook_incoming" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "oracle_address" character varying, "escrow_address" character varying NOT NULL, "results_url" character varying, "check_passed" boolean, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."webhook_incoming_status_enum" NOT NULL, CONSTRAINT "PK_08e16abccb4720323203bf8f7a0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."auths" ADD CONSTRAINT "FK_593ea7ee438b323776029d3185f" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."auths" DROP CONSTRAINT "FK_593ea7ee438b323776029d3185f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."webhook_incoming"`);
    await queryRunner.query(`DROP TYPE "hmt"."webhook_incoming_status_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."reputation"`);
    await queryRunner.query(`DROP TYPE "hmt"."reputation_type_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."auths"`);
    await queryRunner.query(`DROP TABLE "hmt"."users"`);
    await queryRunner.query(`DROP TYPE "hmt"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "hmt"."users_type_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."tokens"`);
    await queryRunner.query(`DROP TYPE "hmt"."tokens_token_type_enum"`);
    await queryRunner.dropSchema(NS);
  }
}
