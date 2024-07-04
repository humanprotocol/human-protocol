import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKYCStatusError1719922587868 implements MigrationInterface {
  name = 'AddKYCStatusError1719922587868';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "hmt"."kycs_status_enum" RENAME TO "kycs_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."kycs_status_enum" AS ENUM('NONE', 'APPROVED', 'SUBMISSION_REQUIRED', 'RESUBMISSION_REQUIRED', 'REJECTED', 'PENDING_VERIFICATION', 'RESET', 'ERROR')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" TYPE "hmt"."kycs_status_enum" USING "status"::"text"::"hmt"."kycs_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" SET DEFAULT 'NONE'`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."kycs_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."kycs_status_enum_old" AS ENUM('NONE', 'APPROVED', 'SUBMISSION_REQUIRED', 'RESUBMISSION_REQUIRED', 'REJECTED', 'PENDING_VERIFICATION', 'RESET')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" TYPE "hmt"."kycs_status_enum_old" USING "status"::"text"::"hmt"."kycs_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ALTER COLUMN "status" SET DEFAULT 'NONE'`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."kycs_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."kycs_status_enum_old" RENAME TO "kycs_status_enum"`,
    );
  }
}
