import { MigrationInterface, QueryRunner } from 'typeorm';

export class CredentialsUpdate1715691499144 implements MigrationInterface {
  name = 'CredentialsUpdate1715691499144';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."credentials" ADD "validator_id" integer`,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."users_type_enum" RENAME TO "users_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_type_enum" AS ENUM('OPERATOR', 'EXCHANGE_ORACLE', 'RECORDING_ORACLE', 'WORKER', 'CREDENTIAL_VALIDATOR')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "type" TYPE "hmt"."users_type_enum" USING "type"::"text"::"hmt"."users_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."users_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "hmt"."credentials" ADD CONSTRAINT "FK_6fa632c26dac67c3c35cdb177a8" FOREIGN KEY ("validator_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."credentials" DROP CONSTRAINT "FK_6fa632c26dac67c3c35cdb177a8"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_type_enum_old" AS ENUM('OPERATOR', 'EXCHANGE_ORACLE', 'RECORDING_ORACLE', 'WORKER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "type" TYPE "hmt"."users_type_enum_old" USING "type"::"text"::"hmt"."users_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."users_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."users_type_enum_old" RENAME TO "users_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."credentials" DROP COLUMN "validator_id"`,
    );
  }
}
