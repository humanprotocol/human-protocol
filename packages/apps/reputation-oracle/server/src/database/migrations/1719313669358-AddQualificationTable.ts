import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQualificationTable1719313669358 implements MigrationInterface {
  name = 'AddQualificationTable1719313669358';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "FK_178ba06ffb4808dbb40e782231e"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_031d62ae4b47ae1a15c3d68179"`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."qualifications" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reference" character varying NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "expires_at" TIMESTAMP, CONSTRAINT "UQ_f9c59623bb945337cd22c538d2b" UNIQUE ("reference"), CONSTRAINT "PK_9ed4d526ac3b76ba3f1c1080433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."qualification_user" ("qualifications_id" integer NOT NULL, "users_id" integer NOT NULL, CONSTRAINT "PK_b1570f4d93c6801886ab48149aa" PRIMARY KEY ("qualifications_id", "users_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a4d0ba2351658ccbb322a92a4" ON "hmt"."qualification_user" ("qualifications_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2265af7a7037b4c8b2067a60de" ON "hmt"."qualification_user" ("users_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "created_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "updated_at" DROP DEFAULT`,
    );
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
      `CREATE UNIQUE INDEX "IDX_271231e19f913b8a0cf028e9e7" ON "hmt"."site_keys" ("site_key", "type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualification_user" ADD CONSTRAINT "FK_0a4d0ba2351658ccbb322a92a49" FOREIGN KEY ("qualifications_id") REFERENCES "hmt"."qualifications"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualification_user" ADD CONSTRAINT "FK_2265af7a7037b4c8b2067a60de3" FOREIGN KEY ("users_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualification_user" DROP CONSTRAINT "FK_2265af7a7037b4c8b2067a60de3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualification_user" DROP CONSTRAINT "FK_0a4d0ba2351658ccbb322a92a49"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_271231e19f913b8a0cf028e9e7"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_type_enum_old" AS ENUM('OPERATOR', 'WORKER', 'HUMAN_APP', 'ADMIN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "type" TYPE "hmt"."users_type_enum_old" USING "type"::"text"::"hmt"."users_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."users_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."users_type_enum_old" RENAME TO "users_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_2265af7a7037b4c8b2067a60de"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_0a4d0ba2351658ccbb322a92a4"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."qualification_user"`);
    await queryRunner.query(`DROP TABLE "hmt"."qualifications"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_031d62ae4b47ae1a15c3d68179" ON "hmt"."site_keys" ("site_key", "type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "FK_178ba06ffb4808dbb40e782231e" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
