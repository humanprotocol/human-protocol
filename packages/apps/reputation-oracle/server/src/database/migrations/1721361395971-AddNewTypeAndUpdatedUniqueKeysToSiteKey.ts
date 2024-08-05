import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewTypeAndUpdatedUniqueKeysToSiteKey1721361395971
  implements MigrationInterface
{
  name = 'AddNewTypeAndUpdatedUniqueKeysToSiteKey1721361395971';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_271231e19f913b8a0cf028e9e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "site_keys_site_key_key"`,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."site_keys_type_enum" RENAME TO "site_keys_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."site_keys_type_enum" AS ENUM('hcaptcha', 'registration')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "type" TYPE "hmt"."site_keys_type_enum" USING "type"::"text"::"hmt"."site_keys_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."site_keys_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "site_keys_user_id_key"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2dcfd04b329a0fd4be7f376512" ON "hmt"."site_keys" ("user_id") WHERE "type" = 'hcaptcha'`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "UQ_7100e356f506f79d28eb2ba3e46" UNIQUE ("site_key", "type", "user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_2dcfd04b329a0fd4be7f376512"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "UQ_7100e356f506f79d28eb2ba3e46"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "site_keys_user_id_key" UNIQUE ("user_id")`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."site_keys_type_enum_old" AS ENUM('fortune', 'cvat', 'hcaptcha')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "type" TYPE "hmt"."site_keys_type_enum_old" USING "type"::"text"::"hmt"."site_keys_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."site_keys_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."site_keys_type_enum_old" RENAME TO "site_keys_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "site_keys_site_key_key" UNIQUE ("site_key")`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_271231e19f913b8a0cf028e9e7" ON "hmt"."site_keys" ("site_key", "type") `,
    );
  }
}
