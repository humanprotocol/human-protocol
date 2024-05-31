import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRewardAmount1717142544478 implements MigrationInterface {
  name = 'AddRewardAmount1717142544478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."assignments" DROP COLUMN "reward_amount"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."assignments"
            ADD "reward_amount" numeric(10, 2) NOT NULL
        `);
  }
}
