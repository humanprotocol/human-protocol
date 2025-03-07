import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNDA1740657822938 implements MigrationInterface {
  name = 'AddNDA1740657822938';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" ADD "nda_signed_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."users" DROP COLUMN "nda_signed_url"`,
    );
  }
}
