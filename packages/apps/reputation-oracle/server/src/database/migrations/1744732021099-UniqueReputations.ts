import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueReputations1744732021099 implements MigrationInterface {
  name = 'UniqueReputations1744732021099';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5012dff596f037415a1370a0cb" ON "hmt"."reputation" ("chain_id", "address", "type") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "hmt"."IDX_5012dff596f037415a1370a0cb"`,
    );
  }
}
