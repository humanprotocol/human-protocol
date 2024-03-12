import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAuthTable1707813322453 implements MigrationInterface {
  name = 'RemoveAuthTable1707813322453';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "hmt"."auths"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"
        `);

    await queryRunner.query(`
            CREATE TYPE "hmt"."tokens_type_enum" AS ENUM('EMAIL', 'PASSWORD', 'REFRESH')
        `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
            ADD "type" "hmt"."tokens_type_enum"
        `);

    await queryRunner.query(`
        UPDATE "hmt"."tokens" SET "type" = 'EMAIL' WHERE "token_type" = 'EMAIL'
    `);

    await queryRunner.query(`
        UPDATE "hmt"."tokens" SET "type" = 'PASSWORD' WHERE "token_type" = 'PASSWORD'
    `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
            ALTER COLUMN "type" SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens" DROP COLUMN "token_type"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."tokens_token_type_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
            ADD "expires_at" TIMESTAMP WITH TIME ZONE
        `);

    await queryRunner.query(`
        UPDATE "hmt"."tokens" SET "expires_at" = "updated_at" + INTERVAL '3 hours'
    `);

    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
            ALTER COLUMN "expires_at" SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "REL_8769073e38c365f315426554ca"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_306030d9411d291750fd115857" ON "hmt"."tokens" ("type", "user_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
            ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"
        `);
    await queryRunner.query(`
            DROP INDEX "hmt"."IDX_306030d9411d291750fd115857"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
            ADD CONSTRAINT "REL_8769073e38c365f315426554ca" UNIQUE ("user_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens" DROP COLUMN "expires_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens" DROP COLUMN "type"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."tokens_type_enum"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."tokens_token_type_enum" AS ENUM('EMAIL', 'PASSWORD')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
            ADD "token_type" "hmt"."tokens_token_type_enum" NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
            ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }
}
