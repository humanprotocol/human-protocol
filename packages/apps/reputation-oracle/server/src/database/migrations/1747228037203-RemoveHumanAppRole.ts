import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveHumanAppRole1747228037203 implements MigrationInterface {
  name = 'RemoveHumanAppRole1747228037203';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "hmt"."users_role_enum" RENAME TO "users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_role_enum" AS ENUM('operator', 'worker', 'admin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "role" TYPE "hmt"."users_role_enum" USING "role"::"text"::"hmt"."users_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."users_role_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."users_role_enum_old" AS ENUM('operator', 'worker', 'human_app', 'admin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ALTER COLUMN "role" TYPE "hmt"."users_role_enum_old" USING "role"::"text"::"hmt"."users_role_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "hmt"."users_role_enum_old" RENAME TO "users_role_enum"`,
    );
  }
}
