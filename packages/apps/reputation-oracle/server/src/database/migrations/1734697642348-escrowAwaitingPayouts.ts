import { MigrationInterface, QueryRunner } from 'typeorm';

export class EscrowAwaitingPayouts1734697642348 implements MigrationInterface {
  name = 'EscrowAwaitingPayouts1734697642348';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
      `CREATE TYPE "hmt"."kycs_status_enum" AS ENUM('none', 'approved', 'resubmission_requested', 'declined', 'review', 'expired', 'abandoned', 'error')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."kycs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "session_id" character varying NOT NULL, "status" "hmt"."kycs_status_enum" NOT NULL DEFAULT 'none', "country" character varying, "message" character varying, "user_id" integer NOT NULL, "url" character varying NOT NULL, CONSTRAINT "UQ_76ea5d4f1a010a5fe4949771f4c" UNIQUE ("session_id"), CONSTRAINT "UQ_bea0dcf47873917fc654b514f36" UNIQUE ("url"), CONSTRAINT "REL_bbfe1fa864841e82cff1be09e8" UNIQUE ("user_id"), CONSTRAINT "PK_6f4a4d2b94576014ab3d5e77694" PRIMARY KEY ("id", "session_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."qualifications" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reference" character varying NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "expires_at" TIMESTAMP, CONSTRAINT "UQ_f9c59623bb945337cd22c538d2b" UNIQUE ("reference"), CONSTRAINT "PK_9ed4d526ac3b76ba3f1c1080433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f9c59623bb945337cd22c538d2" ON "hmt"."qualifications" ("reference") `,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."user_qualifications" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" integer, "qualification_id" integer, CONSTRAINT "PK_4b567ea1379253b4edbec543a08" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_role_enum" AS ENUM('operator', 'worker', 'human_app', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_status_enum" AS ENUM('active', 'inactive', 'pending')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "password" character varying, "email" character varying, "role" "hmt"."users_role_enum" NOT NULL, "evm_address" character varying, "nonce" character varying, "status" "hmt"."users_status_enum" NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_6009c050ae797d7e13ba0b0759b" UNIQUE ("evm_address"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."site_keys_type_enum" AS ENUM('hcaptcha', 'registration')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."site_keys" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "site_key" character varying NOT NULL, "type" "hmt"."site_keys_type_enum" NOT NULL, "user_id" integer, CONSTRAINT "UQ_7100e356f506f79d28eb2ba3e46" UNIQUE ("site_key", "type", "user_id"), CONSTRAINT "PK_bae12fca8759496669088974738" PRIMARY KEY ("id"))`,
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
      `CREATE TYPE "hmt"."webhook_incoming_status_enum" AS ENUM('pending', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."webhook_incoming" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "escrow_address" character varying NOT NULL, "failure_detail" character varying, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."webhook_incoming_status_enum" NOT NULL, CONSTRAINT "PK_08e16abccb4720323203bf8f7a0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ed1eb73afbf214f9bd4c2d03f4" ON "hmt"."webhook_incoming" ("chain_id", "escrow_address") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."reputation_type_enum" AS ENUM('worker', 'job_launcher', 'exchange_oracle', 'recording_oracle', 'reputation_oracle', 'credential_validator')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."reputation" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "address" character varying NOT NULL, "reputation_points" integer NOT NULL, "type" "hmt"."reputation_type_enum" NOT NULL, CONSTRAINT "PK_640807583e8622e1d9bbe6f1b7b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."escrow_payouts_batch" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "escrow_completion_tracking_id" integer NOT NULL, "payouts" json NOT NULL, "payouts_hash" character varying NOT NULL, "tx_hash" character varying, "tx_nonce" integer, CONSTRAINT "PK_6eb1d2e51d7c024fc681dfa67a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_44fd0222c43ed95845dd718f2a" ON "hmt"."escrow_payouts_batch" ("escrow_completion_tracking_id", "payouts_hash") `,
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
      `CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM('process-pending-incoming-webhook', 'process-pending-outgoing-webhook', 'process-pending-escrow-completion-tracking', 'process-paid-escrow-completion-tracking', 'process-awaiting-escrow-payouts')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."cron-jobs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "cron_job_type" "hmt"."cron-jobs_cron_job_type_enum" NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "completed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_268498ac0d3e7472960fb0faeb1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0dafd70b737e71d21490ad0126" ON "hmt"."cron-jobs" ("cron_job_type") `,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."credentials_status_enum" AS ENUM('active', 'expired', 'validated', 'on_chain')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."credentials" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reference" character varying NOT NULL, "description" text NOT NULL, "url" character varying NOT NULL, "status" "hmt"."credentials_status_enum" NOT NULL, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_481aa1ff346d6eee7656880c568" UNIQUE ("reference"), CONSTRAINT "PK_1e38bc43be6697cdda548ad27a6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."credential_validations_status_enum" AS ENUM('validated', 'on_chain')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."credential_validations" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."credential_validations_status_enum" NOT NULL, "certificate" character varying, "credential_id" integer, "user_id" integer, CONSTRAINT "PK_ea03b6fbdfcddca7c2625f6a091" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ADD CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_bfa80c2767c180533958bf9c971" FOREIGN KEY ("qualification_id") REFERENCES "hmt"."qualifications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."escrow_payouts_batch" ADD CONSTRAINT "FK_e0c93d91e0edd3becc3c84ed0a0" FOREIGN KEY ("escrow_completion_tracking_id") REFERENCES "hmt"."escrow_completion_tracking"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."credential_validations" ADD CONSTRAINT "FK_a546350ec2c97f067c802ff672a" FOREIGN KEY ("credential_id") REFERENCES "hmt"."credentials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."credential_validations" ADD CONSTRAINT "FK_d1896792b36ed073631703df40a" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."credential_validations" DROP CONSTRAINT "FK_d1896792b36ed073631703df40a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."credential_validations" DROP CONSTRAINT "FK_a546350ec2c97f067c802ff672a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."escrow_payouts_batch" DROP CONSTRAINT "FK_e0c93d91e0edd3becc3c84ed0a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_bfa80c2767c180533958bf9c971"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" DROP CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."credential_validations"`);
    await queryRunner.query(
      `DROP TYPE "hmt"."credential_validations_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."credentials"`);
    await queryRunner.query(`DROP TYPE "hmt"."credentials_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_0dafd70b737e71d21490ad0126"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."cron-jobs"`);
    await queryRunner.query(`DROP TYPE "hmt"."cron-jobs_cron_job_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_146945054beb996cfe6edf1789"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."escrow_completion_tracking"`);
    await queryRunner.query(
      `DROP TYPE "hmt"."escrow_completion_tracking_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_44fd0222c43ed95845dd718f2a"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."escrow_payouts_batch"`);
    await queryRunner.query(`DROP TABLE "hmt"."reputation"`);
    await queryRunner.query(`DROP TYPE "hmt"."reputation_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_ed1eb73afbf214f9bd4c2d03f4"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."webhook_incoming"`);
    await queryRunner.query(`DROP TYPE "hmt"."webhook_incoming_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_d33daa25634fccb127ead889d4"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."webhook_outgoing"`);
    await queryRunner.query(`DROP TYPE "hmt"."webhook_outgoing_status_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."site_keys"`);
    await queryRunner.query(`DROP TYPE "hmt"."site_keys_type_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."users"`);
    await queryRunner.query(`DROP TYPE "hmt"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "hmt"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."user_qualifications"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_f9c59623bb945337cd22c538d2"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."qualifications"`);
    await queryRunner.query(`DROP TABLE "hmt"."kycs"`);
    await queryRunner.query(`DROP TYPE "hmt"."kycs_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_306030d9411d291750fd115857"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."tokens"`);
    await queryRunner.query(`DROP TYPE "hmt"."tokens_type_enum"`);
  }
}
