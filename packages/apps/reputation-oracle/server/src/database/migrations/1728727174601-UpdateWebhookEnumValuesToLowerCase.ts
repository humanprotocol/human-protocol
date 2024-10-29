import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWebhookEnumValuesToLowerCase1728727174601
  implements MigrationInterface
{
  name = 'UpdateWebhookEnumValuesToLowerCase1728727174601';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Webhook incoming status enum
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhook_incoming_status_enum"
            RENAME TO "webhook_incoming_status_enum_old"
        `);

    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_incoming_status_enum" AS ENUM(
            'pending', 'completed', 'failed', 'paid'
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook_incoming"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
        `);

    await queryRunner.query(`
            UPDATE "hmt"."webhook_incoming"
            SET "status" = LOWER("status")
            WHERE "status" IN ('PENDING', 'COMPLETED', 'FAILED', 'PAID');
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook_incoming"
            ALTER COLUMN "status" TYPE "hmt"."webhook_incoming_status_enum" USING "status"::"hmt"."webhook_incoming_status_enum";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_incoming_status_enum_old";
        `);

    // User role enum
    await queryRunner.query(`
            ALTER TYPE "hmt"."users_role_enum"
            RENAME TO "users_role_enum_old"
          `);

    await queryRunner.query(`
            CREATE TYPE "hmt"."users_role_enum" AS ENUM(
              'operator', 'worker', 'human_app', 'admin'
            )
          `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
          `);

    await queryRunner.query(`
            UPDATE "hmt"."users"
            SET "role" = LOWER("role")
            WHERE "role" IN ('OPERATOR', 'WORKER', 'HUMAN_APP', 'ADMIN');
          `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "role" TYPE "hmt"."users_role_enum" USING "role"::"hmt"."users_role_enum";
          `);

    await queryRunner.query(`
            DROP TYPE "hmt"."users_role_enum_old";
          `);

    // User status enum
    await queryRunner.query(`
            ALTER TYPE "hmt"."users_status_enum"
            RENAME TO "users_status_enum_old"
          `);

    await queryRunner.query(`
            CREATE TYPE "hmt"."users_status_enum" AS ENUM(
              'active', 'inactive', 'pending'
            )
          `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
          `);

    await queryRunner.query(`
            UPDATE "hmt"."users"
            SET "status" = LOWER("status")
            WHERE "status" IN ('ACTIVE', 'INACTIVE', 'PENDING');
          `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "status" TYPE "hmt"."users_status_enum" USING "status"::"hmt"."users_status_enum";
          `);

    await queryRunner.query(`
            DROP TYPE "hmt"."users_status_enum_old";
          `);

    // Creadential status enum
    await queryRunner.query(`
            ALTER TYPE "hmt"."credentials_status_enum"
            RENAME TO "credentials_status_enum_old"
          `);

    await queryRunner.query(`
            CREATE TYPE "hmt"."credentials_status_enum" AS ENUM(
              'active', 'expired', 'validated', 'on_chain'
            )
          `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."credentials"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
          `);

    await queryRunner.query(`
            UPDATE "hmt"."credentials"
            SET "status" = LOWER("status")
            WHERE "status" IN ('ACTIVE', 'EXPIRED', 'VALIDATED', 'ON_CHAIN');
          `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."credentials"
            ALTER COLUMN "status" TYPE "hmt"."credentials_status_enum" USING "status"::"hmt"."credentials_status_enum";
          `);

    await queryRunner.query(`
            DROP TYPE "hmt"."credentials_status_enum_old";
          `);

    // Creadential validation status enum
    await queryRunner.query(`
            ALTER TYPE "hmt"."credential_validations_status_enum"
            RENAME TO "credential_validations_status_enum_old"
          `);

    await queryRunner.query(`
            CREATE TYPE "hmt"."credential_validations_status_enum" AS ENUM(
              'validated', 'on_chain'
            )
          `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."credential_validations"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
          `);

    await queryRunner.query(`
            UPDATE "hmt"."credential_validations"
            SET "status" = LOWER("status")
            WHERE "status" IN ('VALIDATED', 'ON_CHAIN');
          `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."credential_validations"
            ALTER COLUMN "status" TYPE "hmt"."credential_validations_status_enum" USING "status"::"hmt"."credential_validations_status_enum";
          `);

    await queryRunner.query(`
            DROP TYPE "hmt"."credential_validations_status_enum_old";
          `);

    // Reputation type enum
    await queryRunner.query(`
            ALTER TYPE "hmt"."reputation_type_enum"
            RENAME TO "reputation_type_enum_old"
          `);

    await queryRunner.query(`
            CREATE TYPE "hmt"."reputation_type_enum" AS ENUM(
              'worker', 'job_launcher', 'exchange_oracle', 'recording_oracle', 
              'reputation_oracle', 'credential_validator'
            )
          `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."reputation"
            ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;
          `);

    await queryRunner.query(`
            UPDATE "hmt"."reputation"
            SET "type" = LOWER("type")
            WHERE "type" IN ('WORKER', 'JOB_LAUNCHER', 'EXCHANGE_ORACLE', 
                             'RECORDING_ORACLE', 'REPUTATION_ORACLE', 'CREDENTIAL_VALIDATOR');
          `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."reputation"
            ALTER COLUMN "type" TYPE "hmt"."reputation_type_enum" USING "type"::"hmt"."reputation_type_enum";
          `);

    await queryRunner.query(`
            DROP TYPE "hmt"."reputation_type_enum_old";
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Webhook incoming status enum
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_incoming_status_enum_old" AS ENUM(
              'PENDING', 'COMPLETED', 'FAILED', 'PAID'
            );
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook_incoming"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
        `);

    await queryRunner.query(`
            UPDATE "hmt"."webhook_incoming"
            SET "status" = UPPER("status")
            WHERE "status" IN ('pending', 'completed', 'failed', 'paid');
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook_incoming"
            ALTER COLUMN "status" TYPE "hmt"."webhook_incoming_status_enum_old" USING "status"::"hmt"."webhook_incoming_status_enum_old";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_incoming_status_enum";
        `);

    await queryRunner.query(`
            ALTER TYPE "hmt"."webhook_incoming_status_enum_old"
            RENAME TO "webhook_incoming_status_enum";
        `);

    // User role enum
    await queryRunner.query(`
            CREATE TYPE "hmt"."users_role_enum_old" AS ENUM(
              'OPERATOR', 'WORKER', 'HUMAN_APP', 'ADMIN'
            );
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
        `);

    await queryRunner.query(`
            UPDATE "hmt"."users"
            SET "role" = UPPER("role")
            WHERE "role" IN ('operator', 'worker', 'human_app', 'admin');
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "role" TYPE "hmt"."users_role_enum_old" USING "role"::"hmt"."users_role_enum_old";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."users_role_enum";
        `);

    await queryRunner.query(`
            ALTER TYPE "hmt"."users_role_enum_old"
            RENAME TO "users_role_enum";
        `);

    // User status enum
    await queryRunner.query(`
            CREATE TYPE "hmt"."users_status_enum_old" AS ENUM(
              'ACTIVE', 'INACTIVE', 'PENDING'
            );
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
        `);

    await queryRunner.query(`
            UPDATE "hmt"."users"
            SET "status" = UPPER("status")
            WHERE "status" IN ('active', 'inactive', 'pending');
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "status" TYPE "hmt"."users_status_enum_old" USING "status"::"hmt"."users_status_enum_old";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."users_status_enum";
        `);

    await queryRunner.query(`
            ALTER TYPE "hmt"."users_status_enum_old"
            RENAME TO "users_status_enum";
        `);

    // Creadential status enum
    await queryRunner.query(`
            CREATE TYPE "hmt"."credentials_status_enum_old" AS ENUM(
              'ACTIVE', 'EXPIRED', 'VALIDATED', 'ON_CHAIN'
            );
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."credentials"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
        `);

    await queryRunner.query(`
            UPDATE "hmt"."credentials"
            SET "status" = UPPER("status")
            WHERE "status" IN ('active', 'expired', 'validated', 'on_chain');
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."credentials"
            ALTER COLUMN "status" TYPE "hmt"."credentials_status_enum_old" USING "status"::"hmt"."credentials_status_enum_old";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."credentials_status_enum";
        `);

    await queryRunner.query(`
            ALTER TYPE "hmt"."credentials_status_enum_old"
            RENAME TO "credentials_status_enum";
        `);

    // Creadential validation status enum
    await queryRunner.query(`
            CREATE TYPE "hmt"."credential_validations_status_enum_old" AS ENUM(
              'VALIDATED', 'ON_CHAIN'
            );
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."credential_validations"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
        `);

    await queryRunner.query(`
            UPDATE "hmt"."credential_validations"
            SET "status" = UPPER("status")
            WHERE "status" IN ('validated', 'on_chain');
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."credential_validations"
            ALTER COLUMN "status" TYPE "hmt"."credential_validations_status_enum_old" USING "status"::"hmt"."credential_validations_status_enum_old";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."credential_validations_status_enum";
        `);

    await queryRunner.query(`
            ALTER TYPE "hmt"."credential_validations_status_enum_old"
            RENAME TO "credential_validations_status_enum";
        `);

    // Reputation type enum
    await queryRunner.query(`
            CREATE TYPE "hmt"."reputation_type_enum_old" AS ENUM(
              'WORKER', 'JOB_LAUNCHER', 'EXCHANGE_ORACLE', 
              'RECORDING_ORACLE', 'REPUTATION_ORACLE', 'CREDENTIAL_VALIDATOR'
            );
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."reputation"
            ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;
        `);

    await queryRunner.query(`
            UPDATE "hmt"."reputation"
            SET "type" = UPPER("type")
            WHERE "type" IN ('worker', 'job_launcher', 'exchange_oracle', 
                             'recording_oracle', 'reputation_oracle', 'credential_validator');
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."reputation"
            ALTER COLUMN "type" TYPE "hmt"."reputation_type_enum_old" USING "type"::"hmt"."reputation_type_enum_old";
        `);

    await queryRunner.query(`
            DROP TYPE "hmt"."reputation_type_enum";
        `);

    await queryRunner.query(`
            ALTER TYPE "hmt"."reputation_type_enum_old"
            RENAME TO "reputation_type_enum";
        `);
  }
}
