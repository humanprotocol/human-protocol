import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPartialStatus1712826368303 implements MigrationInterface {
  name = 'AddPartialStatus1712826368303';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM(
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
