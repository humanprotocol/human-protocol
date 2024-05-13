import { MigrationInterface, QueryRunner } from 'typeorm';

export class CredentialsSetup1715601213201 implements MigrationInterface {
  name = 'CredentialsSetup1715601213201';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."credentials_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'VALIDATED', 'ON_CHAIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."credentials" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reference" character varying NOT NULL, "description" text NOT NULL, "url" character varying NOT NULL, "status" "hmt"."credentials_status_enum" NOT NULL, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_481aa1ff346d6eee7656880c568" UNIQUE ("reference"), CONSTRAINT "PK_1e38bc43be6697cdda548ad27a6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."credentials_validation_status_enum" AS ENUM('VALIDATED', 'ON_CHAIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."credentials_validation" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."credentials_validation_status_enum" NOT NULL, "certificate" character varying, "credential_id" integer, "user_id" integer, CONSTRAINT "PK_d49f656a82009a4a02e7e4ace5a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."credentials_validation" ADD CONSTRAINT "FK_93e373dfd1956e1718c74376c12" FOREIGN KEY ("credential_id") REFERENCES "hmt"."credentials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."credentials_validation" ADD CONSTRAINT "FK_7e5d8890407c9901ff49ea30e6c" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."credentials_validation" DROP CONSTRAINT "FK_7e5d8890407c9901ff49ea30e6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."credentials_validation" DROP CONSTRAINT "FK_93e373dfd1956e1718c74376c12"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."credentials_validation"`);
    await queryRunner.query(
      `DROP TYPE "hmt"."credentials_validation_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."credentials"`);
    await queryRunner.query(`DROP TYPE "hmt"."credentials_status_enum"`);
  }
}
