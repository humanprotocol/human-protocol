import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewKycStatus1723476224900 implements MigrationInterface {
  name = 'NewKycStatus1723476224900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ADD "url" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ADD CONSTRAINT "UQ_bea0dcf47873917fc654b514f36" UNIQUE ("url")`,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."kycs_status_enum" RENAME TO "kycs_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."kycs_status_enum" AS ENUM('none', 'approved', 'resubmission_requested', 'declined', 'review', 'expired', 'abandoned', 'error')`,
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
      `CREATE TYPE "hmt"."kycs_status_enum_old" AS ENUM('NONE', 'APPROVED', 'SUBMISSION_REQUIRED', 'RESUBMISSION_REQUIRED', 'REJECTED', 'PENDING_VERIFICATION', 'RESET', 'ERROR')`,
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
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" DROP CONSTRAINT "UQ_bea0dcf47873917fc654b514f36"`,
    );
    await queryRunner.query(`ALTER TABLE "hmt"."kycs" DROP COLUMN "url"`);
  }
}
