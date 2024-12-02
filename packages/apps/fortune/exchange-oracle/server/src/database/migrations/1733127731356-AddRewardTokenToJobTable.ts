import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRewardTokenToJobTable1733127731356
  implements MigrationInterface
{
  name = 'AddRewardTokenToJobTable1733127731356';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ADD "reward_token" character varying NOT NULL DEFAULT 'hmt'
        `);

    await queryRunner.query(`
            UPDATE "hmt"."jobs"
            SET "reward_token" = 'hmt'
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "reward_token" DROP DEFAULT
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" DROP COLUMN "reward_token"
        `);
  }
}
