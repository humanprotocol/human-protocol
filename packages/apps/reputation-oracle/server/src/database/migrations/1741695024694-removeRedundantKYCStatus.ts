import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRedundantKYCStatus1741695024694
  implements MigrationInterface
{
  name = 'RemoveRedundantKYCStatus1741695024694';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "hmt"."kycs_status_enum" RENAME TO "kycs_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."kycs_status_enum" AS ENUM('none', 'approved', 'resubmission_requested', 'declined', 'review', 'expired', 'abandoned')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" TYPE "hmt"."kycs_status_enum" USING "status"::"text"::"hmt"."kycs_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" SET DEFAULT 'none'`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."kycs_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."kycs_status_enum_old" AS ENUM('none', 'approved', 'resubmission_requested', 'declined', 'review', 'expired', 'abandoned', 'error')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" TYPE "hmt"."kycs_status_enum_old" USING "status"::"text"::"hmt"."kycs_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" SET DEFAULT 'none'`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."kycs_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."kycs_status_enum_old" RENAME TO "kycs_status_enum"`,
    );
  }
}
