import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUniqueConstraint1696413951581 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."payments" DROP CONSTRAINT "REL_f83af8ea8055b85bde0e095e40"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hmt"."payments" ADD CONSTRAINT "REL_f83af8ea8055b85bde0e095e40" UNIQUE ("job_id")`,
    );
  }
}
