import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOraclesToJobTable1727190080540 implements MigrationInterface {
  name = 'AddOraclesToJobTable1727190080540';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ADD "reputation_oracle" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ADD "exchange_oracle" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ADD "recording_oracle" character varying
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" DROP COLUMN "recording_oracle"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" DROP COLUMN "exchange_oracle"
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs" DROP COLUMN "reputation_oracle"
        `);
  }
}
