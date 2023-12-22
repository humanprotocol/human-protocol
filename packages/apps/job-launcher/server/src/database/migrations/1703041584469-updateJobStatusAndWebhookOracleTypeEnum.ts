import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateJobStatusAndWebhookOracleTypeEnum1703041584469
  implements MigrationInterface
{
  name = 'UpdateJobStatusAndWebhookOracleTypeEnum1703041584469';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM(
                'PENDING',
                'PAID',
                'LAUNCHING',
                'FUNDING',
                'LAUNCHED',
                'COMPLETED',
                'FAILED',
                'TO_CANCEL',
                'CANCELED'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum" USING "status"::"text"::"hmt"."jobs_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum_old"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhook_oracle_type_enum"
            RENAME TO "webhook_oracle_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_oracle_type_enum" AS ENUM('fortune', 'cvat', 'hcaptcha')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook"
            ALTER COLUMN "oracle_type" TYPE "hmt"."webhook_oracle_type_enum" USING "oracle_type"::"text"::"hmt"."webhook_oracle_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_oracle_type_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_oracle_type_enum_old" AS ENUM('fortune', 'cvat')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook"
            ALTER COLUMN "oracle_type" TYPE "hmt"."webhook_oracle_type_enum_old" USING "oracle_type"::"text"::"hmt"."webhook_oracle_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_oracle_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhook_oracle_type_enum_old"
            RENAME TO "webhook_oracle_type_enum"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum_old" AS ENUM(
                'PENDING',
                'PAID',
                'LAUNCHING',
                'FUNDING',
                'LAUNCHED',
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
  }
}
