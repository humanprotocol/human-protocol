import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTokenEnum1741276609531 implements MigrationInterface {
  name = 'RemoveTokenEnum1741276609531';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" DROP COLUMN "token"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_token_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ADD "token" character varying NOT NULL DEFAULT 'hmt'
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "token" DROP DEFAULT
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" DROP COLUMN "token"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_token_enum" AS ENUM('hmt', 'usdt')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ADD "token" "hmt"."jobs_token_enum" NOT NULL
        `);
  }
}
