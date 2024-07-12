import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQualification1720093298582 implements MigrationInterface {
  name = 'AddQualification1720093298582';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hmt"."qualifications" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reference" character varying NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "expires_at" TIMESTAMP, CONSTRAINT "UQ_f9c59623bb945337cd22c538d2b" UNIQUE ("reference"), CONSTRAINT "PK_9ed4d526ac3b76ba3f1c1080433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f9c59623bb945337cd22c538d2" ON "hmt"."qualifications" ("reference") `,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."user_qualifications" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" integer, "qualification_id" integer, CONSTRAINT "PK_4b567ea1379253b4edbec543a08" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_bfa80c2767c180533958bf9c971" FOREIGN KEY ("qualification_id") REFERENCES "hmt"."qualifications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_bfa80c2767c180533958bf9c971"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."user_qualifications"`);
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_f9c59623bb945337cd22c538d2"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."qualifications"`);
  }
}
