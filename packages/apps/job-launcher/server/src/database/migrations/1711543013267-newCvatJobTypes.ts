import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewCvatJobTypes1711543013267 implements MigrationInterface {
  name = 'NewCvatJobTypes1711543013267';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhook_event_type_enum"
            RENAME TO "webhook_event_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_event_type_enum" AS ENUM(
                'escrow_created',
                'escrow_canceled',
                'escrow_completed',
                'task_creation_failed',
                'escrow_failed'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook"
            ALTER COLUMN "event_type" TYPE "hmt"."webhook_event_type_enum" USING "event_type"::"text"::"hmt"."webhook_event_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_event_type_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_request_type_enum"
            RENAME TO "jobs_request_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_request_type_enum" AS ENUM(
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
            ALTER COLUMN "request_type" TYPE "hmt"."jobs_request_type_enum" USING "request_type"::"text"::"hmt"."jobs_request_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_request_type_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_request_type_enum_old" AS ENUM(
                'IMAGE_POINTS',
                'IMAGE_BOXES',
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
            CREATE TYPE "hmt"."webhook_event_type_enum_old" AS ENUM(
                'escrow_created',
                'escrow_canceled',
                'task_creation_failed'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook"
            ALTER COLUMN "event_type" TYPE "hmt"."webhook_event_type_enum_old" USING "event_type"::"text"::"hmt"."webhook_event_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_event_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhook_event_type_enum_old"
            RENAME TO "webhook_event_type_enum"
        `);
  }
}
