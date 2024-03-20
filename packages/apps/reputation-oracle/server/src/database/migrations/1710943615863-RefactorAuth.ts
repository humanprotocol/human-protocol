import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorAuth1710943615863 implements MigrationInterface {
  name = 'RefactorAuth1710943615863';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hmt"."api_keys" ("id" SERIAL NOT NULL, "hashed_api_key" character varying NOT NULL, "salt" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "REL_a3baee01d8408cd3c0f89a9a97" UNIQUE ("user_id"), CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" DROP COLUMN "token_type"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."tokens_token_type_enum"`);
    await queryRunner.query(
      `CREATE TYPE "hmt"."tokens_type_enum" AS ENUM('EMAIL', 'PASSWORD', 'REFRESH')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD "type" "hmt"."tokens_type_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "REL_8769073e38c365f315426554ca"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_306030d9411d291750fd115857" ON "hmt"."tokens" ("type", "user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."api_keys" ADD CONSTRAINT "FK_a3baee01d8408cd3c0f89a9a973" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."api_keys" DROP CONSTRAINT "FK_a3baee01d8408cd3c0f89a9a973"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_306030d9411d291750fd115857"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD CONSTRAINT "REL_8769073e38c365f315426554ca" UNIQUE ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" DROP COLUMN "expires_at"`,
    );
    await queryRunner.query(`ALTER TABLE "hmt"."tokens" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "hmt"."tokens_type_enum"`);
    await queryRunner.query(
      `CREATE TYPE "hmt"."tokens_token_type_enum" AS ENUM('EMAIL', 'PASSWORD')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD "token_type" "hmt"."tokens_token_type_enum" NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."api_keys"`);
  }
}
