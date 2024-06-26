import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAssignment1717112007469 implements MigrationInterface {
  name = 'UpdateAssignment1717112007469';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."assignments"
            ADD "reward_amount" numeric(10, 2) DEFAULT 0
        `);
    await queryRunner.query(`
        ALTER TABLE "hmt"."assignments"
        ALTER COLUMN "reward_amount" DROP DEFAULT
    `);

    await queryRunner.query(`
        ALTER TABLE "hmt"."assignments"
        ALTER COLUMN "reward_amount" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."assignments" DROP COLUMN "reward_amount"
        `);
  }
}
