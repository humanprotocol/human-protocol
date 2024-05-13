import { MigrationInterface, QueryRunner } from 'typeorm';

export class CredentialsSetup1715601874032 implements MigrationInterface {
  name = 'CredentialsSetup1715601874032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "hmt"."credential_validations_status_enum" AS ENUM('VALIDATED', 'ON_CHAIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."credential_validations" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "hmt"."credential_validations_status_enum" NOT NULL, "certificate" character varying, "credential_id" integer, "user_id" integer, CONSTRAINT "PK_ea03b6fbdfcddca7c2625f6a091" PRIMARY KEY ("id"))`,
    );
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
    await queryRunner.query(`DROP TABLE "hmt"."credential_validations"`);
    await queryRunner.query(
      `DROP TYPE "hmt"."credential_validations_status_enum"`,
    );
  }
}
