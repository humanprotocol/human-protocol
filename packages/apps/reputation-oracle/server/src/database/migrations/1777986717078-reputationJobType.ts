import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReputationJobType1777986717078 implements MigrationInterface {
  name = 'ReputationJobType1777986717078';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_5012dff596f037415a1370a0cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."reputation" ADD "job_request_type" character varying NOT NULL DEFAULT 'image_skeletons_from_boxes'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e2589f31dc15f8cadca6c560ff" ON "hmt"."reputation" ("chain_id", "address", "type", "job_request_type") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_e2589f31dc15f8cadca6c560ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hmt"."reputation" DROP COLUMN "job_request_type"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5012dff596f037415a1370a0cb" ON "hmt"."reputation" ("chain_id", "address", "type") `,
    );
  }
}
