import { NS } from '../../common/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1698914497531 implements MigrationInterface {
  name = 'InitialMigration1698914497531';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(NS, true);
    await queryRunner.query(
      `CREATE TYPE "hmt"."reputation_type_enum" AS ENUM('LIQUIDITY_PROVIDER', 'JOB_LAUNCHER', 'EXCHANGE_ORACLE', 'RECORDING_ORACLE', 'REPUTATION_ORACLE')`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "hmt"."webhook_incoming"`);
    await queryRunner.query(`DROP TYPE "hmt"."webhook_incoming_status_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."reputation"`);
    await queryRunner.query(`DROP TYPE "hmt"."reputation_type_enum"`);
    await queryRunner.dropSchema(NS);
  }
}
