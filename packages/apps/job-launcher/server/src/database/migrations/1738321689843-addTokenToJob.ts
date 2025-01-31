import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenToJob1738321689843 implements MigrationInterface {
  name = 'AddTokenToJob1738321689843';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_token_enum" AS ENUM('hmt')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ADD "token" "hmt"."jobs_token_enum" NOT NULL DEFAULT 'hmt'
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
            DROP TYPE "hmt"."jobs_token_enum"
        `);
  }
}
