import { MigrationInterface, QueryRunner } from 'typeorm';

export class CascadeDeletion1747219638888 implements MigrationInterface {
  name = 'CascadeDeletion1747219638888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" DROP CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_bfa80c2767c180533958bf9c971"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."abuses" DROP CONSTRAINT "FK_8136cf4f4cef59bdb54d17c714d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ADD CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_bfa80c2767c180533958bf9c971" FOREIGN KEY ("qualification_id") REFERENCES "hmt"."qualifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."abuses" ADD CONSTRAINT "FK_8136cf4f4cef59bdb54d17c714d" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" DROP CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."abuses" DROP CONSTRAINT "FK_8136cf4f4cef59bdb54d17c714d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_bfa80c2767c180533958bf9c971"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" DROP CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" DROP CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."site_keys" ADD CONSTRAINT "FK_266dc68bd3412cb17b5d927b30c" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."abuses" ADD CONSTRAINT "FK_8136cf4f4cef59bdb54d17c714d" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_bfa80c2767c180533958bf9c971" FOREIGN KEY ("qualification_id") REFERENCES "hmt"."qualifications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."user_qualifications" ADD CONSTRAINT "FK_6b49cc36c9a6ed1f393840709d5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."kycs" ADD CONSTRAINT "FK_bbfe1fa864841e82cff1be09e8b" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "hmt"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
