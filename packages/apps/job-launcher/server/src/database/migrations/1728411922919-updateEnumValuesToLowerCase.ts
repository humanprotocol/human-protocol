import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEnumValuesToLowerCase1728411922919
  implements MigrationInterface
{
  name = 'UpdateEnumValuesToLowerCase1728411922919';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhook_status_enum"
            RENAME TO "webhook_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_status_enum" AS ENUM('pending', 'completed', 'failed')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook"
            ALTER COLUMN "status" TYPE "hmt"."webhook_status_enum" USING "status"::"text"::"hmt"."webhook_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_status_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."payments_type_enum"
            RENAME TO "payments_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_type_enum" AS ENUM('deposit', 'refund', 'withdrawal')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments"
            ALTER COLUMN "type" TYPE "hmt"."payments_type_enum" USING "type"::"text"::"hmt"."payments_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_type_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."payments_source_enum"
            RENAME TO "payments_source_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_source_enum" AS ENUM('fiat', 'crypto', 'balance')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments"
            ALTER COLUMN "source" TYPE "hmt"."payments_source_enum" USING "source"::"text"::"hmt"."payments_source_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_source_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."payments_status_enum"
            RENAME TO "payments_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_status_enum" AS ENUM('pending', 'failed', 'succeeded')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments"
            ALTER COLUMN "status" TYPE "hmt"."payments_status_enum" USING "status"::"text"::"hmt"."payments_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_status_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."users_type_enum"
            RENAME TO "users_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."users_type_enum" AS ENUM('operator', 'requester')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "type" TYPE "hmt"."users_type_enum" USING "type"::"text"::"hmt"."users_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."users_type_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."users_status_enum"
            RENAME TO "users_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."users_status_enum" AS ENUM('active', 'inactive', 'pending')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "status" TYPE "hmt"."users_status_enum" USING "status"::"text"::"hmt"."users_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."users_status_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_request_type_enum"
            RENAME TO "jobs_request_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_request_type_enum" AS ENUM(
                'image_points',
                'image_boxes',
                'image_boxes_from_points',
                'image_skeletons_from_boxes',
                'hcaptcha',
                'fortune'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "request_type" TYPE "hmt"."jobs_request_type_enum" USING "request_type"::"text"::"hmt"."jobs_request_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_request_type_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM(
                'pending',
                'paid',
                'created',
                'set_up',
                'launched',
                'partial',
                'completed',
                'failed',
                'to_cancel',
                'canceled'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum" USING "status"::"text"::"hmt"."jobs_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum_old" AS ENUM(
                'PENDING',
                'PAID',
                'CREATED',
                'SET_UP',
                'LAUNCHED',
                'PARTIAL',
                'COMPLETED',
                'FAILED',
                'TO_CANCEL',
                'CANCELED'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum_old" USING "status"::"text"::"hmt"."jobs_status_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum_old"
            RENAME TO "jobs_status_enum"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_request_type_enum_old" AS ENUM(
                'IMAGE_POINTS',
                'IMAGE_BOXES',
                'IMAGE_BOXES_FROM_POINTS',
                'IMAGE_SKELETONS_FROM_BOXES',
                'HCAPTCHA',
                'FORTUNE'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "request_type" TYPE "hmt"."jobs_request_type_enum_old" USING "request_type"::"text"::"hmt"."jobs_request_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_request_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_request_type_enum_old"
            RENAME TO "jobs_request_type_enum"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."users_status_enum_old" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "status" TYPE "hmt"."users_status_enum_old" USING "status"::"text"::"hmt"."users_status_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."users_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."users_status_enum_old"
            RENAME TO "users_status_enum"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."users_type_enum_old" AS ENUM('OPERATOR', 'REQUESTER')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ALTER COLUMN "type" TYPE "hmt"."users_type_enum_old" USING "type"::"text"::"hmt"."users_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."users_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."users_type_enum_old"
            RENAME TO "users_type_enum"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_status_enum_old" AS ENUM('PENDING', 'FAILED', 'SUCCEEDED')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments"
            ALTER COLUMN "status" TYPE "hmt"."payments_status_enum_old" USING "status"::"text"::"hmt"."payments_status_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."payments_status_enum_old"
            RENAME TO "payments_status_enum"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_source_enum_old" AS ENUM('FIAT', 'CRYPTO', 'BALANCE')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments"
            ALTER COLUMN "source" TYPE "hmt"."payments_source_enum_old" USING "source"::"text"::"hmt"."payments_source_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_source_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."payments_source_enum_old"
            RENAME TO "payments_source_enum"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."payments_type_enum_old" AS ENUM('DEPOSIT', 'REFUND', 'WITHDRAWAL')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."payments"
            ALTER COLUMN "type" TYPE "hmt"."payments_type_enum_old" USING "type"::"text"::"hmt"."payments_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."payments_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."payments_type_enum_old"
            RENAME TO "payments_type_enum"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_status_enum_old" AS ENUM('PENDING', 'COMPLETED', 'FAILED')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook"
            ALTER COLUMN "status" TYPE "hmt"."webhook_status_enum_old" USING "status"::"text"::"hmt"."webhook_status_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhook_status_enum_old"
            RENAME TO "webhook_status_enum"
        `);
  }
}
