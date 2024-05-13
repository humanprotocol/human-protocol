import { MigrationInterface, QueryRunner } from 'typeorm';

export class CredentialsSetup1715564456257 implements MigrationInterface {
  name = 'CredentialsSetup1715564456257';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."credential_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'VALIDATED', 'ON_CHAIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."credential" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "reference" character varying NOT NULL, "description" text NOT NULL, "url" character varying NOT NULL, "status" "hmt"."credential_status_enum" NOT NULL, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_e3d8a369dd434df2ba064be73dd" UNIQUE ("reference"), CONSTRAINT "PK_3a5169bcd3d5463cefeec78be82" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."credential_validation_entity_status_enum" AS ENUM('VALIDATED', 'ON_CHAIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "credential_validation_entity" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."credential_validation_entity_status_enum" NOT NULL, "certificate" character varying, "credential_id" integer, "user_id" integer, CONSTRAINT "PK_3d2c55b0b843b93fa4210d800d1" PRIMARY KEY ("id"))`,
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
      `ALTER TABLE "credential_validation_entity" ADD CONSTRAINT "FK_690c598d5dfb31ea404e3319976" FOREIGN KEY ("credential_id") REFERENCES "hmt"."credential"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credential_validation_entity" ADD CONSTRAINT "FK_c0abcf447063f821838f895c2fa" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "credential_validation_entity" DROP CONSTRAINT "FK_c0abcf447063f821838f895c2fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credential_validation_entity" DROP CONSTRAINT "FK_690c598d5dfb31ea404e3319976"`,
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
    await queryRunner.query(`DROP TABLE "credential_validation_entity"`);
    await queryRunner.query(
      `DROP TYPE "public"."credential_validation_entity_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."credential"`);
    await queryRunner.query(`DROP TYPE "hmt"."credential_status_enum"`);
  }
}
