import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNda1739367701589 implements MigrationInterface {
  name = 'AddNda1739367701589';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hmt"."nda_versions" (
        "id" SERIAL NOT NULL, 
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
        "version" character varying NOT NULL, 
        "document_text" text NOT NULL, 
        CONSTRAINT "UQ_b65bffe967a53d7e313a998f0cd" UNIQUE ("version"), 
        CONSTRAINT "PK_f30f3c77e93c00ea2abccb387b2" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE TYPE "hmt"."ndas_status_enum" AS ENUM('signed', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."ndas" (
        "id" SERIAL NOT NULL, 
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
        "status" "hmt"."ndas_status_enum" NOT NULL, 
        "ip_address" character varying NOT NULL, 
        "user_id" integer, 
        "nda_version_id" integer, 
        CONSTRAINT "PK_97727ee03b6a96f6a34969bf96f" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."ndas" 
       ADD CONSTRAINT "FK_6d948a281f3aefdfe757fb2d71c" 
       FOREIGN KEY ("user_id") 
       REFERENCES "hmt"."users"("id") 
       ON DELETE NO ACTION 
       ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."ndas" 
       ADD CONSTRAINT "FK_4619b51c4e3138e9642341b5c24" 
       FOREIGN KEY ("nda_version_id") 
       REFERENCES "hmt"."nda_versions"("id") 
       ON DELETE NO ACTION 
       ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."ndas" 
       DROP CONSTRAINT "FK_4619b51c4e3138e9642341b5c24"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."ndas" 
       DROP CONSTRAINT "FK_6d948a281f3aefdfe757fb2d71c"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."ndas"`);
    await queryRunner.query(`DROP TYPE "hmt"."ndas_status_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."nda_versions"`);
  }
}
