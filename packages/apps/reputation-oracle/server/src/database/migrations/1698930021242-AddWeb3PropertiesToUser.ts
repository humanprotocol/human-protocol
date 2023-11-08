import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeb3PropertiesToUser1698930021242
  implements MigrationInterface
{
  name = 'AddWeb3PropertiesToUser1698930021242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ADD "evm_address" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ADD CONSTRAINT "UQ_6009c050ae797d7e13ba0b0759b" UNIQUE ("evm_address")`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ADD "nonce" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "password" DROP NOT NULL`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_type_enum_old" AS ENUM('OPERATOR', 'REQUESTER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "type" TYPE "hmt"."users_type_enum_old" USING "type"::"text"::"hmt"."users_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."users_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."users_type_enum_old" RENAME TO "users_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "password" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "hmt"."users" DROP COLUMN "nonce"`);
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" DROP CONSTRAINT "UQ_6009c050ae797d7e13ba0b0759b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" DROP COLUMN "evm_address"`,
    );
  }
}
