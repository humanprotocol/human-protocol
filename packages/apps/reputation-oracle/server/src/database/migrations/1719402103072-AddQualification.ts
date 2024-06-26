import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQualification1719402103072 implements MigrationInterface {
  name = 'AddQualification1719402103072';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hmt"."qualifications" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reference" character varying NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "expires_at" TIMESTAMP, CONSTRAINT "UQ_f9c59623bb945337cd22c538d2b" UNIQUE ("reference"), CONSTRAINT "PK_9ed4d526ac3b76ba3f1c1080433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."qualification_user" ("qualifications_id" integer NOT NULL, "users_id" integer NOT NULL, CONSTRAINT "PK_200eb7eae7eab2c939f11be3745" PRIMARY KEY ("qualifications_id", "users_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8501fd4a300aa1427682000030" ON "hmt"."qualification_user" ("qualifications_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5efb7e2d36658b87858ad64f30" ON "hmt"."qualification_user" ("users_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualification_user" ADD CONSTRAINT "FK_8501fd4a300aa14276820000307" FOREIGN KEY ("qualifications_id") REFERENCES "hmt"."qualifications"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualification_user" ADD CONSTRAINT "FK_5efb7e2d36658b87858ad64f302" FOREIGN KEY ("users_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualification_user" DROP CONSTRAINT "FK_5efb7e2d36658b87858ad64f302"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualification_user" DROP CONSTRAINT "FK_8501fd4a300aa14276820000307"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_5efb7e2d36658b87858ad64f30"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_8501fd4a300aa1427682000030"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."qualification_user"`);
    await queryRunner.query(`DROP TABLE "hmt"."qualifications"`);
  }
}
