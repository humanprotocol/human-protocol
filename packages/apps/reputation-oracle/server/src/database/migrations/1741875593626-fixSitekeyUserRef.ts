import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSitekeyUserRef1741875593626 implements MigrationInterface {
  name = 'FixSitekeyUserRef1741875593626';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "user_id" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
  }
}
