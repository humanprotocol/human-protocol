import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTokenEntity1742377717756 implements MigrationInterface {
  name = 'UpdateTokenEntity1742377717756';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_306030d9411d291750fd115857"`,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."tokens_type_enum" RENAME TO "tokens_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."tokens_type_enum" AS ENUM('email', 'password', 'refresh')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ALTER COLUMN "type" TYPE "hmt"."tokens_type_enum" USING "type"::"text"::"hmt"."tokens_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."tokens_type_enum_old"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_306030d9411d291750fd115857" ON "hmt"."tokens" ("type", "user_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_306030d9411d291750fd115857"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."tokens_type_enum_old" AS ENUM('EMAIL', 'PASSWORD', 'REFRESH')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ALTER COLUMN "type" TYPE "hmt"."tokens_type_enum_old" USING "type"::"text"::"hmt"."tokens_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."tokens_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."tokens_type_enum_old" RENAME TO "tokens_type_enum"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_306030d9411d291750fd115857" ON "hmt"."tokens" ("type", "user_id") `,
    );
  }
}
