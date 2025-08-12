import { MigrationInterface, QueryRunner } from 'typeorm';

import { DATABASE_SCHEMA_NAME } from '@/common/constants';

export class InitialMigration1752590727473 implements MigrationInterface {
  name = 'InitialMigration1752590727473';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(DATABASE_SCHEMA_NAME, true);
    await queryRunner.query(
      `CREATE TYPE "hmt"."reputation_type_enum" AS ENUM('worker', 'job_launcher', 'exchange_oracle', 'recording_oracle', 'reputation_oracle')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."reputation" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "address" character varying NOT NULL, "type" "hmt"."reputation_type_enum" NOT NULL, "reputation_points" integer NOT NULL, CONSTRAINT "PK_640807583e8622e1d9bbe6f1b7b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5012dff596f037415a1370a0cb" ON "hmt"."reputation" ("chain_id", "address", "type") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."tokens_type_enum" AS ENUM('email', 'password', 'refresh')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."tokens" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "hmt"."tokens_type_enum" NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_57b0dd7af7c6a0b7d4c3fd5c464" UNIQUE ("uuid"), CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_306030d9411d291750fd115857" ON "hmt"."tokens" ("type", "user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_role_enum" AS ENUM('operator', 'worker', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_status_enum" AS ENUM('active', 'pending', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "password" character varying, "email" character varying, "role" "hmt"."users_role_enum" NOT NULL, "evm_address" character varying, "nonce" character varying, "status" "hmt"."users_status_enum" NOT NULL, "nda_signed_url" character varying, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_6009c050ae797d7e13ba0b0759b" UNIQUE ("evm_address"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."kycs_status_enum" AS ENUM('none', 'approved', 'resubmission_requested', 'declined', 'review', 'expired', 'abandoned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."kycs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "session_id" character varying NOT NULL, "status" "hmt"."kycs_status_enum" NOT NULL DEFAULT 'none', "country" character varying, "message" character varying, "user_id" integer NOT NULL, "url" character varying NOT NULL, CONSTRAINT "UQ_76ea5d4f1a010a5fe4949771f4c" UNIQUE ("session_id"), CONSTRAINT "UQ_bea0dcf47873917fc654b514f36" UNIQUE ("url"), CONSTRAINT "REL_bbfe1fa864841e82cff1be09e8" UNIQUE ("user_id"), CONSTRAINT "PK_6f4a4d2b94576014ab3d5e77694" PRIMARY KEY ("id", "session_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM('process-pending-incoming-webhook', 'process-pending-outgoing-webhook', 'process-pending-escrow-completion-tracking', 'process-paid-escrow-completion-tracking', 'process-awaiting-escrow-payouts', 'process-requested-abuse', 'process-classified-abuse', 'delete-expired-database-records')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."cron-jobs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "cron_job_type" "hmt"."cron-jobs_cron_job_type_enum" NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "completed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_268498ac0d3e7472960fb0faeb1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0dafd70b737e71d21490ad0126" ON "hmt"."cron-jobs" ("cron_job_type") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."site_keys_type_enum" AS ENUM('hcaptcha', 'registration')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."site_keys" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "site_key" character varying NOT NULL, "type" "hmt"."site_keys_type_enum" NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_7100e356f506f79d28eb2ba3e46" UNIQUE ("site_key", "type", "user_id"), CONSTRAINT "PK_bae12fca8759496669088974738" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."qualifications" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reference" character varying NOT NULL, "title" character varying(50) NOT NULL, "description" character varying(200) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_f9c59623bb945337cd22c538d2b" UNIQUE ("reference"), CONSTRAINT "PK_9ed4d526ac3b76ba3f1c1080433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f9c59623bb945337cd22c538d2" ON "hmt"."qualifications" ("reference") `,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."user_qualifications" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" integer NOT NULL, "qualification_id" integer NOT NULL, CONSTRAINT "PK_4b567ea1379253b4edbec543a08" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f40f66a6ba16b27a81ec48f566" ON "hmt"."user_qualifications" ("user_id", "qualification_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."webhook_incoming_status_enum" AS ENUM('pending', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."webhook_incoming" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "escrow_address" character varying NOT NULL, "failure_detail" character varying, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."webhook_incoming_status_enum" NOT NULL, CONSTRAINT "PK_08e16abccb4720323203bf8f7a0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ed1eb73afbf214f9bd4c2d03f4" ON "hmt"."webhook_incoming" ("chain_id", "escrow_address") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."escrow_completion_tracking_status_enum" AS ENUM('pending', 'awaiting_payouts', 'paid', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."escrow_completion_tracking" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "escrow_address" character varying NOT NULL, "final_results_url" character varying, "final_results_hash" character varying, "failure_detail" character varying, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."escrow_completion_tracking_status_enum" NOT NULL, CONSTRAINT "PK_a6abebca3ce8e49155aaf14ccc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_146945054beb996cfe6edf1789" ON "hmt"."escrow_completion_tracking" ("escrow_address", "chain_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."escrow_payouts_batch" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "escrow_completion_tracking_id" integer NOT NULL, "payouts" json NOT NULL, "payouts_hash" character varying NOT NULL, "tx_nonce" integer, CONSTRAINT "PK_6eb1d2e51d7c024fc681dfa67a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_44fd0222c43ed95845dd718f2a" ON "hmt"."escrow_payouts_batch" ("escrow_completion_tracking_id", "payouts_hash") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."abuses_status_enum" AS ENUM('pending', 'completed', 'failed', 'notified')`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."abuses_decision_enum" AS ENUM('rejected', 'accepted')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."abuses" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "escrow_address" character varying NOT NULL, "status" "hmt"."abuses_status_enum" NOT NULL, "decision" "hmt"."abuses_decision_enum", "amount" numeric(30,18), "reason" text NOT NULL, "user_id" integer NOT NULL, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_8cfbf5b6d26e83e4fd5955c8c8b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_023d33d90733aa64f612995657" ON "hmt"."abuses" ("chain_id", "escrow_address") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."webhook_outgoing_status_enum" AS ENUM('pending', 'sent', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."webhook_outgoing" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "payload" jsonb NOT NULL, "hash" character varying NOT NULL, "url" character varying NOT NULL, "failure_detail" character varying, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."webhook_outgoing_status_enum" NOT NULL, CONSTRAINT "PK_d232b33ccee326e251936e16c5f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d33daa25634fccb127ead889d4" ON "hmt"."webhook_outgoing" ("hash") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ADD CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_bfa80c2767c180533958bf9c971" FOREIGN KEY ("qualification_id") REFERENCES "hmt"."qualifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."escrow_payouts_batch" ADD CONSTRAINT "FK_e0c93d91e0edd3becc3c84ed0a0" FOREIGN KEY ("escrow_completion_tracking_id") REFERENCES "hmt"."escrow_completion_tracking"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."abuses" ADD CONSTRAINT "FK_8136cf4f4cef59bdb54d17c714d" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."abuses" DROP CONSTRAINT "FK_8136cf4f4cef59bdb54d17c714d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."escrow_payouts_batch" DROP CONSTRAINT "FK_e0c93d91e0edd3becc3c84ed0a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_bfa80c2767c180533958bf9c971"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" DROP CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_d33daa25634fccb127ead889d4"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."webhook_outgoing"`);
    await queryRunner.query(`DROP TYPE "hmt"."webhook_outgoing_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_023d33d90733aa64f612995657"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."abuses"`);
    await queryRunner.query(`DROP TYPE "hmt"."abuses_decision_enum"`);
    await queryRunner.query(`DROP TYPE "hmt"."abuses_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_44fd0222c43ed95845dd718f2a"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."escrow_payouts_batch"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_146945054beb996cfe6edf1789"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."escrow_completion_tracking"`);
    await queryRunner.query(
      `DROP TYPE "hmt"."escrow_completion_tracking_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_ed1eb73afbf214f9bd4c2d03f4"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."webhook_incoming"`);
    await queryRunner.query(`DROP TYPE "hmt"."webhook_incoming_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_f40f66a6ba16b27a81ec48f566"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."user_qualifications"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_f9c59623bb945337cd22c538d2"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."qualifications"`);
    await queryRunner.query(`DROP TABLE "hmt"."site_keys"`);
    await queryRunner.query(`DROP TYPE "hmt"."site_keys_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_0dafd70b737e71d21490ad0126"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."cron-jobs"`);
    await queryRunner.query(`DROP TYPE "hmt"."cron-jobs_cron_job_type_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."kycs"`);
    await queryRunner.query(`DROP TYPE "hmt"."kycs_status_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."users"`);
    await queryRunner.query(`DROP TYPE "hmt"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "hmt"."users_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_306030d9411d291750fd115857"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."tokens"`);
    await queryRunner.query(`DROP TYPE "hmt"."tokens_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_5012dff596f037415a1370a0cb"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."reputation"`);
    await queryRunner.query(`DROP TYPE "hmt"."reputation_type_enum"`);
    await queryRunner.dropSchema(DATABASE_SCHEMA_NAME);
  }
}
