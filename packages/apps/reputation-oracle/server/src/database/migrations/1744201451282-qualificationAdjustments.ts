import { MigrationInterface, QueryRunner } from 'typeorm';

export class QualificationAdjustments1744201451282
  implements MigrationInterface
{
  name = 'QualificationAdjustments1744201451282';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_bfa80c2767c180533958bf9c971"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ALTER COLUMN "qualification_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" DROP COLUMN "title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" ADD "title" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" ADD "description" character varying(200) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" DROP COLUMN "expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" ADD "expires_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f40f66a6ba16b27a81ec48f566" ON "hmt"."user_qualifications" ("user_id", "qualification_id") `,
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
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_f40f66a6ba16b27a81ec48f566"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" DROP COLUMN "expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" ADD "expires_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" ADD "description" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" DROP COLUMN "title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."qualifications" ADD "title" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ALTER COLUMN "qualification_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_bfa80c2767c180533958bf9c971" FOREIGN KEY ("qualification_id") REFERENCES "hmt"."qualifications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
