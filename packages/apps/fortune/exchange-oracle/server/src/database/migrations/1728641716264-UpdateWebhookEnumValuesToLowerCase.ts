import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWebhookEnumValuesToLowerCase1728641716264 implements MigrationInterface {
    name = 'UpdateWebhookEnumValuesToLowerCase1728641716264'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Webhook status enum
        await queryRunner.query(`
            ALTER TYPE "hmt"."webhooks_status_enum"
            RENAME TO "webhooks_status_enum_old"
          `);
    
        await queryRunner.query(`
            CREATE TYPE "hmt"."webhooks_status_enum" AS ENUM(
              'pending', 'completed', 'failed'
            )
          `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."webhooks"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
          `);
    
        await queryRunner.query(`
            UPDATE "hmt"."webhooks"
            SET "status" = LOWER("status")
            WHERE "status" IN ('PENDING', 'COMPLETED', 'FAILED');
          `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."webhooks"
            ALTER COLUMN "status" TYPE "hmt"."webhooks_status_enum" USING "status"::"hmt"."webhooks_status_enum";
          `);
    
        await queryRunner.query(`
            DROP TYPE "hmt"."webhooks_status_enum_old";
          `);

        // Job status enum
        await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
          `);
    
        await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM(
              'active', 'completed', 'canceled'
            )
          `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
          `);
    
        await queryRunner.query(`
            UPDATE "hmt"."jobs"
            SET "status" = LOWER("status")
            WHERE "status" IN ('ACTIVE', 'COMPLETED', 'CANCELED');
          `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum" USING "status"::"hmt"."jobs_status_enum";
          `);
    
        await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum_old";
          `);


        // Assignment status enum
        await queryRunner.query(`
            ALTER TYPE "hmt"."assignments_status_enum"
            RENAME TO "assignments_status_enum_old"
          `);
    
        await queryRunner.query(`
            CREATE TYPE "hmt"."assignments_status_enum" AS ENUM(
              'active', 'validation', 'completed', 'expired', 'canceled', 'rejected'
            )
          `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."assignments"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
          `);
    
        await queryRunner.query(`
            UPDATE "hmt"."assignments"
            SET "status" = LOWER("status")
            WHERE "status" IN ('ACTIVE', 'VALIDATION', 'COMPLETED', 'EXPIRED', 'CANCELED', 'REJECTED');
          `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."assignments"
            ALTER COLUMN "status" TYPE "hmt"."assignments_status_enum" USING "status"::"hmt"."assignments_status_enum";
          `);
    
        await queryRunner.query(`
            DROP TYPE "hmt"."assignments_status_enum_old";
          `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Webhook status enum
        await queryRunner.query(`
            CREATE TYPE "hmt"."webhooks_status_enum_old" AS ENUM(
              'PENDING', 'COMPLETED', 'FAILED'
            );
        `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."webhooks"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
        `);
    
        await queryRunner.query(`
            UPDATE "hmt"."webhooks"
            SET "status" = UPPER("status")
            WHERE "status" IN ('pending', 'completed', 'failed');
        `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."webhooks"
            ALTER COLUMN "status" TYPE "hmt"."webhooks_status_enum_old" USING "status"::"hmt"."webhooks_status_enum_old";
        `);
    
        await queryRunner.query(`
            DROP TYPE "hmt"."webhooks_status_enum";
        `);
    
        await queryRunner.query(`
            ALTER TYPE "hmt"."webhooks_status_enum_old"
            RENAME TO "webhooks_status_enum";
        `);

        // Job status enum
        await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum_old" AS ENUM(
              'ACTIVE', 'COMPLETED', 'CANCELED'
            );
        `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
        `);
    
        await queryRunner.query(`
            UPDATE "hmt"."jobs"
            SET "status" = UPPER("status")
            WHERE "status" IN ('active', 'completed', 'canceled');
        `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum_old" USING "status"::"hmt"."jobs_status_enum_old";
        `);
    
        await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum";
        `);
    
        await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum_old"
            RENAME TO "jobs_status_enum";
        `);

        // Assignment status enum
        await queryRunner.query(`
            CREATE TYPE "hmt"."assignments_status_enum_old" AS ENUM(
              'ACTIVE', 'VALIDATION', 'COMPLETED', 'EXPIRED', 'CANCELED', 'REJECTED'
            );
        `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."assignments"
            ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
        `);
    
        await queryRunner.query(`
            UPDATE "hmt"."assignments"
            SET "status" = UPPER("status")
            WHERE "status" IN ('active', 'validation', 'completed', 'expired', 'canceled', 'rejected');
        `);
    
        await queryRunner.query(`
            ALTER TABLE "hmt"."assignments"
            ALTER COLUMN "status" TYPE "hmt"."assignments_status_enum_old" USING "status"::"hmt"."assignments_status_enum_old";
        `);
    
        await queryRunner.query(`
            DROP TYPE "hmt"."assignments_status_enum";
        `);
    
        await queryRunner.query(`
            ALTER TYPE "hmt"."assignments_status_enum_old"
            RENAME TO "assignments_status_enum";
        `);
    }

}
