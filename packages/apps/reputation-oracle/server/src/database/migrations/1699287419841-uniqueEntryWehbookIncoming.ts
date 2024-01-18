import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueEntryWehbookIncoming1699287419841
  implements MigrationInterface
{
  name = 'UniqueEntryWehbookIncoming1699287419841';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "hmt"."users_type_enum" RENAME TO "users_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_type_enum" AS ENUM('OPERATOR', 'EXCHANGE_ORACLE', 'RECORDING_ORACLE', 'WORKER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "type" TYPE "hmt"."users_type_enum" USING "type"::"text"::"hmt"."users_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."users_type_enum_old"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ed1eb73afbf214f9bd4c2d03f4" ON "hmt"."webhook_incoming" ("chain_id", "escrow_address") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_ed1eb73afbf214f9bd4c2d03f4"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_type_enum_old" AS ENUM('OPERATOR', 'REQUESTER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "type" TYPE "hmt"."users_type_enum_old" USING "type"::"text"::"hmt"."users_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."users_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."users_type_enum_old" RENAME TO "users_type_enum"`,
    );
  }
}
