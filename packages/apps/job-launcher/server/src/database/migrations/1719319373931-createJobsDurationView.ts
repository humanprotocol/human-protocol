import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobsDurationView1719319373931 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE VIEW "hmt"."completed_jobs_duration" AS
          SELECT 
              id,
              user_id,
              EXTRACT(EPOCH FROM (updated_at - created_at)) AS completion_time_seconds
          FROM 
              "hmt"."jobs"
          WHERE 
              status = 'COMPLETED';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW "hmt"."completed_jobs_duration"`);
  }
}
