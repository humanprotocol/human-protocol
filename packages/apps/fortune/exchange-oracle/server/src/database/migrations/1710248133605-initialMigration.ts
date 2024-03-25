import { NS } from '../../common/constant';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1710248133605 implements MigrationInterface {
  name = 'InitialMigration1710248133605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(NS, true);
    await queryRunner.query(`
            CREATE TYPE "hmt"."assignment_status_enum" AS ENUM(
                'ACTIVE',
                'VALIDATION',
                'COMPLETED',
                'EXPIRED',
                'CANCELED',
                'REJECTED'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "hmt"."assignment" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "job_id" integer NOT NULL,
                "worker_address" character varying NOT NULL,
                "status" "hmt"."assignment_status_enum" NOT NULL,
                CONSTRAINT "PK_43c2f5a3859f54cedafb270f37e" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_14aa5962b550a5aaf5a6b6ab61" ON "hmt"."assignment" ("job_id", "worker_address")
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."job_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELED')
        `);
    await queryRunner.query(`
            CREATE TABLE "hmt"."job" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "chain_id" integer,
                "escrow_address" character varying,
                "status" "hmt"."job_status_enum" NOT NULL,
                CONSTRAINT "PK_98ab1c14ff8d1cf80d18703b92f" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_69bc2165dddf5544733838adbe" ON "hmt"."job" ("chain_id", "escrow_address")
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_event_type_enum" AS ENUM(
                'escrow_created',
                'escrow_canceled',
                'task_creation_failed',
                'submission_rejected'
            )
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
                "retries_count" integer NOT NULL,
                "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL,
                "status" "hmt"."webhook_status_enum" NOT NULL,
                CONSTRAINT "PK_e6765510c2d078db49632b59020" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."assignment"
            ADD CONSTRAINT "FK_e2262a906a37770a56a1a7168d4" FOREIGN KEY ("job_id") REFERENCES "hmt"."job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."assignment" DROP CONSTRAINT "FK_e2262a906a37770a56a1a7168d4"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."webhook"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_event_type_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_69bc2165dddf5544733838adbe"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."job"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."job_status_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_14aa5962b550a5aaf5a6b6ab61"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."assignment"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."assignment_status_enum"
        `);
    await queryRunner.dropSchema(NS);
  }
}
