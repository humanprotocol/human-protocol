import { MigrationInterface, QueryRunner } from 'typeorm';

export class CredentialsSetup1715610735337 implements MigrationInterface {
  name = 'CredentialsSetup1715610735337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."credentials_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'VALIDATED', 'ON_CHAIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."credentials" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reference" character varying NOT NULL, "description" text NOT NULL, "url" character varying NOT NULL, "status" "hmt"."credentials_status_enum" NOT NULL, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_481aa1ff346d6eee7656880c568" UNIQUE ("reference"), CONSTRAINT "PK_1e38bc43be6697cdda548ad27a6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."credential_validations_status_enum" AS ENUM('VALIDATED', 'ON_CHAIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."credential_validations" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."credential_validations_status_enum" NOT NULL, "certificate" character varying, "credential_id" integer, "user_id" integer, CONSTRAINT "PK_ea03b6fbdfcddca7c2625f6a091" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."reputation_type_enum" RENAME TO "reputation_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."reputation_type_enum" AS ENUM('WORKER', 'JOB_LAUNCHER', 'EXCHANGE_ORACLE', 'RECORDING_ORACLE', 'REPUTATION_ORACLE', 'CREDENTIAL_VALIDATOR')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."reputation" ALTER COLUMN "type" TYPE "hmt"."reputation_type_enum" USING "type"::"text"::"hmt"."reputation_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."reputation_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "hmt"."credential_validations" ADD CONSTRAINT "FK_a546350ec2c97f067c802ff672a" FOREIGN KEY ("credential_id") REFERENCES "hmt"."credentials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."credential_validations" ADD CONSTRAINT "FK_d1896792b36ed073631703df40a" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."credential_validations" DROP CONSTRAINT "FK_d1896792b36ed073631703df40a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."credential_validations" DROP CONSTRAINT "FK_a546350ec2c97f067c802ff672a"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."reputation_type_enum_old" AS ENUM('WORKER', 'JOB_LAUNCHER', 'EXCHANGE_ORACLE', 'RECORDING_ORACLE', 'REPUTATION_ORACLE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."reputation" ALTER COLUMN "type" TYPE "hmt"."reputation_type_enum_old" USING "type"::"text"::"hmt"."reputation_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."reputation_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."reputation_type_enum_old" RENAME TO "reputation_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."credential_validations"`);
    await queryRunner.query(
      `DROP TYPE "hmt"."credential_validations_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."credentials"`);
    await queryRunner.query(`DROP TYPE "hmt"."credentials_status_enum"`);
  }
}
