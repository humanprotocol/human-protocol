import { MigrationInterface, QueryRunner } from "typeorm";
import { NS } from '../../common/constants';

export class InitialMigration1689951618753 implements MigrationInterface {
    name = 'InitialMigration1689951618753'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createSchema(NS, true);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await queryRunner.query(`CREATE TYPE "hmt"."payment_type_enum" AS ENUM('DEPOSIT', 'REFUND', 'WITHDRAWAL')`);
        await queryRunner.query(`CREATE TYPE "hmt"."payment_source_enum" AS ENUM('FIAT', 'CRYPTO', 'BALANCE')`);
        await queryRunner.query(`CREATE TABLE "hmt"."payment" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "payment_id" character varying, "transaction_hash" character varying, "amount" character varying NOT NULL, "rate" numeric(5,2) NOT NULL, "currency" character varying NOT NULL, "type" "hmt"."payment_type_enum" NOT NULL, "source" "hmt"."payment_source_enum" NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "hmt"."job_status_enum" AS ENUM('PENDING', 'PAID', 'LAUNCHED', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "hmt"."job" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "chain_id" integer NOT NULL, "escrow_address" character varying NOT NULL, "fee" character varying NOT NULL, "fund_amount" character varying NOT NULL, "manifest_url" character varying NOT NULL, "manifest_hash" character varying NOT NULL, "status" "hmt"."job_status_enum" NOT NULL, "user_id" integer NOT NULL, "retries_count" integer NOT NULL, "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_98ab1c14ff8d1cf80d18703b92f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "hmt"."user_type_enum" AS ENUM('OPERATOR', 'REQUESTER')`);
        await queryRunner.query(`CREATE TYPE "hmt"."user_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING')`);
        await queryRunner.query(`CREATE TABLE "hmt"."user" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "password" character varying NOT NULL, "email" character varying, "stripe_customer_id" character varying, "type" "hmt"."user_type_enum" NOT NULL, "status" "hmt"."user_status_enum" NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_8053b76f596e6fa3b56582be939" UNIQUE ("stripe_customer_id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "hmt"."auth_status_enum" AS ENUM('ACTIVE', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "hmt"."auth" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "token_id" character varying NOT NULL, "status" "hmt"."auth_status_enum" NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "REL_9922406dc7d70e20423aeffadf" UNIQUE ("user_id"), CONSTRAINT "PK_7e416cf6172bc5aec04244f6459" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "hmt"."token_token_type_enum" AS ENUM('EMAIL', 'PASSWORD')`);
        await queryRunner.query(`CREATE TABLE "hmt"."token" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_type" "hmt"."token_token_type_enum" NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_a9a66098c2fb758dff713f8d838" UNIQUE ("uuid"), CONSTRAINT "REL_e50ca89d635960fda2ffeb1763" UNIQUE ("user_id"), CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hmt"."payment" ADD CONSTRAINT "FK_c66c60a17b56ec882fcd8ec770b" FOREIGN KEY ("user_id") REFERENCES "hmt"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hmt"."job" ADD CONSTRAINT "FK_13dd4ad96c9a725eadf48db7558" FOREIGN KEY ("user_id") REFERENCES "hmt"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hmt"."auth" ADD CONSTRAINT "FK_9922406dc7d70e20423aeffadf3" FOREIGN KEY ("user_id") REFERENCES "hmt"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hmt"."token" ADD CONSTRAINT "FK_e50ca89d635960fda2ffeb17639" FOREIGN KEY ("user_id") REFERENCES "hmt"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hmt"."token" DROP CONSTRAINT "FK_e50ca89d635960fda2ffeb17639"`);
        await queryRunner.query(`ALTER TABLE "hmt"."auth" DROP CONSTRAINT "FK_9922406dc7d70e20423aeffadf3"`);
        await queryRunner.query(`ALTER TABLE "hmt"."job" DROP CONSTRAINT "FK_13dd4ad96c9a725eadf48db7558"`);
        await queryRunner.query(`ALTER TABLE "hmt"."payment" DROP CONSTRAINT "FK_c66c60a17b56ec882fcd8ec770b"`);
        await queryRunner.query(`DROP TABLE "hmt"."token"`);
        await queryRunner.query(`DROP TYPE "hmt"."token_token_type_enum"`);
        await queryRunner.query(`DROP TABLE "hmt"."auth"`);
        await queryRunner.query(`DROP TYPE "hmt"."auth_status_enum"`);
        await queryRunner.query(`DROP TABLE "hmt"."user"`);
        await queryRunner.query(`DROP TYPE "hmt"."user_status_enum"`);
        await queryRunner.query(`DROP TYPE "hmt"."user_type_enum"`);
        await queryRunner.query(`DROP TABLE "hmt"."job"`);
        await queryRunner.query(`DROP TYPE "hmt"."job_status_enum"`);
        await queryRunner.query(`DROP TABLE "hmt"."payment"`);
        await queryRunner.query(`DROP TYPE "hmt"."payment_source_enum"`);
        await queryRunner.query(`DROP TYPE "hmt"."payment_type_enum"`);
        await queryRunner.dropSchema(NS);
    }

}
