import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReasonToAbuse1750766313641 implements MigrationInterface {
  name = 'AddReasonToAbuse1750766313641';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hmt"."abuses" ADD "reason" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hmt"."abuses" DROP COLUMN "reason"`);
  }
}
