import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAuthsTable1718897436892 implements MigrationInterface {
  name = 'DropAuthsTable1718897436892';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."auths" DROP CONSTRAINT "FK_593ea7ee438b323776029d3185f"`,
    );
    await queryRunner.query(`DROP TABLE "hmt"."auths"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hmt"."auths" (
        "id" SERIAL NOT NULL, 
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, 
        "access_token" character varying NOT NULL, 
        "refresh_token" character varying NOT NULL, 
        "user_id" integer NOT NULL, 
        CONSTRAINT "REL_593ea7ee438b323776029d3185" UNIQUE ("user_id"), 
        CONSTRAINT "PK_22fc0631a651972ddc9c5a31090" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."auths" ADD CONSTRAINT "FK_593ea7ee438b323776029d3185f" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
