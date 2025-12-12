import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePausedStatus1762175785287 implements MigrationInterface {
  name = 'RemovePausedStatus1762175785287';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM('active', 'completed', 'canceled')
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
            CREATE TYPE "hmt"."jobs_status_enum_old" AS ENUM('active', 'paused', 'completed', 'canceled')
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
