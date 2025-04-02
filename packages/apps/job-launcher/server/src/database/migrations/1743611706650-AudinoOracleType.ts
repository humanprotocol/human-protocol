import { MigrationInterface, QueryRunner } from 'typeorm';

export class AudinoOracleType1743611706650 implements MigrationInterface {
  name = 'AudinoOracleType1743611706650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhook_oracle_type_enum"
            RENAME TO "webhook_oracle_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_oracle_type_enum" AS ENUM('fortune', 'cvat', 'audino', 'hcaptcha')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook"
            ALTER COLUMN "oracle_type" TYPE "hmt"."webhook_oracle_type_enum" USING "oracle_type"::"text"::"hmt"."webhook_oracle_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_oracle_type_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."webhook_oracle_type_enum_old" AS ENUM('fortune', 'cvat', 'hcaptcha')
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."webhook"
            ALTER COLUMN "oracle_type" TYPE "hmt"."webhook_oracle_type_enum_old" USING "oracle_type"::"text"::"hmt"."webhook_oracle_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."webhook_oracle_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."webhook_oracle_type_enum_old"
            RENAME TO "webhook_oracle_type_enum"
        `);
  }
}
