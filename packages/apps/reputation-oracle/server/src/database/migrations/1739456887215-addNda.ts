import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNda1739456887215 implements MigrationInterface {
  name = 'AddNda1739456887215';

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
      `CREATE TYPE "hmt"."nda_signatures_status_enum" AS ENUM('signed', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hmt"."nda_signatures" (
        "id" SERIAL NOT NULL, 
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
        "status" "hmt"."nda_signatures_status_enum" NOT NULL, 
        "ip_address" character varying NOT NULL, 
        "nda_version_id" integer NOT NULL, 
        "user_id" integer NOT NULL, 
        CONSTRAINT "PK_029cea6b8839e90a765f043da06" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."nda_signatures" 
        ADD CONSTRAINT "FK_8684d3a1d0e395bb3080ed1ee9e" 
        FOREIGN KEY ("user_id") 
        REFERENCES "hmt"."users"("id") 
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."nda_signatures" 
        ADD CONSTRAINT "FK_794a76e04564fd8f98f56bbf82b" 
        FOREIGN KEY ("nda_version_id") 
        REFERENCES "hmt"."nda_versions"("id") 
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."nda_signatures" 
        DROP CONSTRAINT "FK_794a76e04564fd8f98f56bbf82b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."nda_signatures" 
        DROP CONSTRAINT "FK_8684d3a1d0e395bb3080ed1ee9e"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."nda_signatures"`);
    await queryRunner.query(`DROP TYPE "hmt"."nda_signatures_status_enum"`);
    await queryRunner.query(`DROP TABLE "hmt"."nda_versions"`);
  }
}
