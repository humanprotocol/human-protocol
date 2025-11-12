import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnusedEscrowStatuses1762941180729
  implements MigrationInterface
{
  name = 'RemoveUnusedEscrowStatuses1762941180729';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum"
            RENAME TO "jobs_status_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum" AS ENUM(
                'paid',
                'under_moderation',
                'moderation_passed',
                'possible_abuse_in_review',
                'launched',
                'partial',
                'completed',
                'failed',
                'to_cancel',
                'canceling',
                'canceled'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum" USING "status"::"text"::"hmt"."jobs_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_status_enum_old" AS ENUM(
                'canceled',
                'canceling',
                'completed',
                'created',
                'failed',
                'funded',
                'launched',
                'moderation_passed',
                'paid',
                'partial',
                'possible_abuse_in_review',
                'to_cancel',
                'under_moderation'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "status" TYPE "hmt"."jobs_status_enum_old" USING "status"::"text"::"hmt"."jobs_status_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_status_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_status_enum_old"
            RENAME TO "jobs_status_enum"
        `);
  }
}
