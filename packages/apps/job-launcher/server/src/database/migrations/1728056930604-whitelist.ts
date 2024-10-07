import { MigrationInterface, QueryRunner } from 'typeorm';

export class Whitelist1728056930604 implements MigrationInterface {
  name = 'Whitelist1728056930604';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "hmt"."whitelist" (
                "id" SERIAL NOT NULL,
                "user_id" integer,
                CONSTRAINT "REL_963f4d9041f735ed614cf1f3ac" UNIQUE ("user_id"),
                CONSTRAINT "PK_0169bfbd49b0511243f7a068cec" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."whitelist"
            ADD CONSTRAINT "FK_963f4d9041f735ed614cf1f3acf" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."whitelist" DROP CONSTRAINT "FK_963f4d9041f735ed614cf1f3acf"
        `);
    await queryRunner.query(`
            DROP TABLE "hmt"."whitelist"
        `);
  }
}
