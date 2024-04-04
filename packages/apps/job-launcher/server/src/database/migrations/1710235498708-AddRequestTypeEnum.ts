import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequestTypeEnum1710235498708 implements MigrationInterface {
  name = 'AddRequestTypeEnum1710235498708';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_request_type_enum" AS ENUM(
                'IMAGE_POINTS',
                'IMAGE_BOXES',
                'HCAPTCHA',
                'FORTUNE'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ADD "request_type" "hmt"."jobs_request_type_enum" NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."jobs" DROP COLUMN "request_type"`,
    );
    await queryRunner.query(`DROP TYPE "hmt"."jobs_request_type_enum"`);
  }
}
