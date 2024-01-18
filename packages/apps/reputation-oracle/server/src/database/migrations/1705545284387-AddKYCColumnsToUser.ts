import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKYCColumnsToUser1705545284387 implements MigrationInterface {
  name = 'AddKYCColumnsToUser1705545284387';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ADD "kyc_session_id" character varying`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_kyc_status_enum" AS ENUM('NONE', 'APPROVED', 'SUBMISSION_REQUIRED', 'RESUBMISSION_REQUIRED', 'REJECTED', 'PENDING_VERIFICATION', 'RESET')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ADD "kyc_status" "hmt"."users_kyc_status_enum" NOT NULL DEFAULT 'NONE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" DROP COLUMN "kyc_status"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."users_kyc_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" DROP COLUMN "kyc_session_id"`,
    );
  }
}
