import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExchangeApiKeys1761653939799 implements MigrationInterface {
  name = 'ExchangeApiKeys1761653939799';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hmt"."exchange_api_keys" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "exchange_name" character varying(20) NOT NULL, "api_key" character varying(1000) NOT NULL, "secret_key" character varying(10000) NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_3751a8a0ef5354b32b06ea43983" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_96ee74195b058a1b55afc49f67" ON "hmt"."exchange_api_keys" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."exchange_api_keys" ADD CONSTRAINT "FK_96ee74195b058a1b55afc49f673" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."exchange_api_keys" DROP CONSTRAINT "FK_96ee74195b058a1b55afc49f673"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_96ee74195b058a1b55afc49f67"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."exchange_api_keys"`);
  }
}
