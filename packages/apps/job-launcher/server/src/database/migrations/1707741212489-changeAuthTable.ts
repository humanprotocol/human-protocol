import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeAuthTable1707741212489 implements MigrationInterface {
  name = 'ChangeAuthTable1707741212489';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths" DROP CONSTRAINT "FK_593ea7ee438b323776029d3185f"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
                RENAME COLUMN "token_type" TO "type"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."tokens_token_type_enum"
            RENAME TO "tokens_type_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths" DROP COLUMN "access_token"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths" DROP COLUMN "refresh_token"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths"
            ADD "access_jwt_id" character varying NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths"
            ADD CONSTRAINT "UQ_2328882b4af6e6b6c7559115c36" UNIQUE ("access_jwt_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths"
            ADD "refresh_jwt_id" character varying NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths"
            ADD CONSTRAINT "UQ_f20055fa090798968647ff3783e" UNIQUE ("refresh_jwt_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
            ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths"
            ADD CONSTRAINT "FK_593ea7ee438b323776029d3185f" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths" DROP CONSTRAINT "FK_593ea7ee438b323776029d3185f"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths" DROP CONSTRAINT "UQ_f20055fa090798968647ff3783e"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths" DROP COLUMN "refresh_jwt_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths" DROP CONSTRAINT "UQ_2328882b4af6e6b6c7559115c36"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths" DROP COLUMN "access_jwt_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths"
            ADD "refresh_token" character varying NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths"
            ADD "access_token" character varying NOT NULL
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."tokens_type_enum"
            RENAME TO "tokens_token_type_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
                RENAME COLUMN "type" TO "token_type"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."auths"
            ADD CONSTRAINT "FK_593ea7ee438b323776029d3185f" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."tokens"
            ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }
}
