import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycTable1706196712859 implements MigrationInterface {
  name = 'AddKycTable1706196712859';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."kycs_status_enum" AS ENUM('NONE', 'APPROVED', 'SUBMISSION_REQUIRED', 'RESUBMISSION_REQUIRED', 'REJECTED', 'PENDING_VERIFICATION', 'RESET')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."kycs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "session_id" character varying NOT NULL, "status" "hmt"."kycs_status_enum" NOT NULL DEFAULT 'NONE', "message" character varying, "user_id" integer NOT NULL, CONSTRAINT "UQ_76ea5d4f1a010a5fe4949771f4c" UNIQUE ("session_id"), CONSTRAINT "REL_bbfe1fa864841e82cff1be09e8" UNIQUE ("user_id"), CONSTRAINT "PK_6f4a4d2b94576014ab3d5e77694" PRIMARY KEY ("id", "session_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ADD CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" DROP CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."kycs"`);
    await queryRunner.query(`DROP TYPE "hmt"."kycs_status_enum"`);
  }
}
