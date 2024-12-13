import { MigrationInterface, QueryRunner } from 'typeorm';

export class EscrowAwaitingPayments1734099565372 implements MigrationInterface {
  name = 'EscrowAwaitingPayments1734099565372';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "hmt"."escrow_completion_tracking_status_enum" RENAME TO "escrow_completion_tracking_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."escrow_completion_tracking_status_enum" AS ENUM('pending', 'awaiting_payments', 'paid', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."escrow_completion_tracking" ALTER COLUMN "status" TYPE "hmt"."escrow_completion_tracking_status_enum" USING "status"::"text"::"hmt"."escrow_completion_tracking_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "hmt"."escrow_completion_tracking_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."escrow_completion_tracking_status_enum_old" AS ENUM('pending', 'paid', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."escrow_completion_tracking" ALTER COLUMN "status" TYPE "hmt"."escrow_completion_tracking_status_enum_old" USING "status"::"text"::"hmt"."escrow_completion_tracking_status_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "hmt"."escrow_completion_tracking_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."escrow_completion_tracking_status_enum_old" RENAME TO "escrow_completion_tracking_status_enum"`,
    );
  }
}
