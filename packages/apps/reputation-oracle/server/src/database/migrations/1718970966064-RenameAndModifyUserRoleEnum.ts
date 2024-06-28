import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameAndModifyUserRoleEnum1718970966064
  implements MigrationInterface
{
  name = 'RenameAndModifyUserRoleEnum1718970966064';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "FK_178ba06ffb4808dbb40e782231e"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_031d62ae4b47ae1a15c3d68179"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "created_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "updated_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" RENAME COLUMN "type" TO "role"`,
    );
    await queryRunner.query(
      `ALTER TYPE "hmt"."users_type_enum" RENAME TO "users_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_role_enum" AS ENUM('OPERATOR', 'WORKER', 'HUMAN_APP', 'ADMIN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "role" TYPE "hmt"."users_role_enum" USING "role"::"text"::"hmt"."users_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."users_type_enum_old"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_271231e19f913b8a0cf028e9e7" ON "hmt"."site_keys" ("site_key", "type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c"`,
    );
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_271231e19f913b8a0cf028e9e7"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_type_enum_old" AS ENUM('OPERATOR', 'WORKER', 'HUMAN_APP', 'ADMIN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "role" TYPE "hmt"."users_type_enum_old" USING "role"::"text"::"hmt"."users_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."users_type_enum_old" RENAME TO "users_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_031d62ae4b47ae1a15c3d68179" ON "hmt"."site_keys" ("site_key", "type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "FK_178ba06ffb4808dbb40e782231e" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" RENAME COLUMN "role" TO "type"`,
    );
  }
}
