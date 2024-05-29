import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEnum1716985384786 implements MigrationInterface {
  name = 'UpdateEnum1716985384786';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignments_status_enum') THEN
                    CREATE TYPE "hmt"."assignments_status_enum" AS ENUM(
                        'ACTIVE',
                        'VALIDATION',
                        'COMPLETED',
                        'EXPIRED',
                        'CANCELED',
                        'REJECTED'
                    );
                END IF;
            END
            $$;
        `);

    await queryRunner.query(`
            CREATE TABLE "hmt"."assignments" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "job_id" integer NOT NULL,
                "worker_address" character varying NOT NULL,
                "status" "hmt"."assignments_status_enum" NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "PK_c54ca359535e0012b04dcbd80ee" PRIMARY KEY ("id")
            );
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_f9fea6dcc065d190ed04d7f9d4" ON "hmt"."assignments" ("job_id", "worker_address");
        `);

    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jobs_status_enum') THEN
                    CREATE TYPE "hmt"."jobs_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELED');
                END IF;
            END
            $$;
        `);

    await queryRunner.query(`
            CREATE TABLE "hmt"."jobs" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "chain_id" integer NOT NULL,
                "escrow_address" character varying NOT NULL,
                "status" "hmt"."jobs_status_enum" NOT NULL,
                "reputation_network" character varying NOT NULL,
                CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id")
            );
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_59f6c552b618c432f019500e7c" ON "hmt"."jobs" ("chain_id", "escrow_address");
        `);

    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhooks_event_type_enum') THEN
                    CREATE TYPE "hmt"."webhooks_event_type_enum" AS ENUM(
                        'escrow_created',
                        'escrow_canceled',
                        'task_creation_failed',
                        'submission_rejected',
                        'submission_in_review'
                    );
                END IF;
            END
            $$;
        `);

    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhooks_status_enum') THEN
                    CREATE TYPE "hmt"."webhooks_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED');
                END IF;
            END
            $$;
        `);

    await queryRunner.query(`
            CREATE TABLE "hmt"."webhooks" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "chain_id" integer NOT NULL,
                "escrow_address" character varying NOT NULL,
                "event_type" "hmt"."webhooks_event_type_enum" NOT NULL,
                "retries_count" integer NOT NULL,
                "wait_until" TIMESTAMP WITH TIME ZONE NOT NULL,
                "status" "hmt"."webhooks_status_enum" NOT NULL,
                CONSTRAINT "PK_9e8795cfc899ab7bdaa831e8527" PRIMARY KEY ("id")
            );
        `);

    await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron-jobs_cron_job_type_enum') THEN
                    ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum" RENAME TO "cron-jobs_cron_job_type_enum_old";
                END IF;
            END
            $$;
        `);

    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron-jobs_cron_job_type_enum') THEN
                    CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum" AS ENUM('process-pending-webhook');
                END IF;
            END
            $$;
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."cron-jobs"
            ALTER COLUMN "cron_job_type" TYPE "hmt"."cron-jobs_cron_job_type_enum" USING "cron_job_type"::text::"hmt"."cron-jobs_cron_job_type_enum";
        `);

    await queryRunner.query(`
            DROP TYPE IF EXISTS "hmt"."cron-jobs_cron_job_type_enum_old";
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."assignments"
            ADD CONSTRAINT "FK_4a6cf5345a71aa620ee6a0d9c8c" FOREIGN KEY ("job_id") REFERENCES "hmt"."jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."assignments" DROP CONSTRAINT "FK_4a6cf5345a71aa620ee6a0d9c8c";
        `);

    await queryRunner.query(`
            CREATE TYPE "hmt"."cron-jobs_cron_job_type_enum_old" AS ENUM('process-pending-webhook', 'process-paid-webhook');
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."cron-jobs"
            ALTER COLUMN "cron_job_type" TYPE "hmt"."cron-jobs_cron_job_type_enum_old" USING "cron_job_type"::text::"hmt"."cron-jobs_cron_job_type_enum_old";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."cron-jobs_cron_job_type_enum";
        `);

    await queryRunner.query(`
            ALTER TYPE "hmt"."cron-jobs_cron_job_type_enum_old" RENAME TO "cron-jobs_cron_job_type_enum";
        `);

    await queryRunner.query(`
            DROP TABLE "hmt"."webhooks";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."webhooks_status_enum";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."webhooks_event_type_enum";
        `);

    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_59f6c552b618c432f019500e7c";
        `);

    await queryRunner.query(`
            DROP TABLE "hmt"."jobs";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum";
        `);

    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_f9fea6dcc065d190ed04d7f9d4";
        `);

    await queryRunner.query(`
            DROP TABLE "hmt"."assignments";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."assignments_status_enum";
        `);
  }
}
