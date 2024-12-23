import { MigrationInterface, QueryRunner } from 'typeorm';

export class JobStatusFunded1730895674938 implements MigrationInterface {
  name = 'JobStatusFunded1730895674938';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM(
                'pending',
                'paid',
                'created',
                'funded',
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
