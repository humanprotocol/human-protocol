import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameStripeCustomerIdColumn1749498615107 implements MigrationInterface {

  name = 'RenameStripeCustomerIdColumn1749498615107';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "hmt"."users"
            RENAME COLUMN "stripe_customer_id" TO "payment_provider_id"
    `);
    await queryRunner.query(`
        ALTER TABLE "hmt"."users"
            RENAME CONSTRAINT "UQ_5ffbe395603641c29e8ce9b4c97" TO "UQ_721ffe5f6051eb5c6ac35321213"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "hmt"."users"
            RENAME CONSTRAINT "UQ_721ffe5f6051eb5c6ac35321213" TO "UQ_5ffbe395603641c29e8ce9b4c97"
    `);
    await queryRunner.query(`
        ALTER TABLE "hmt"."users"
            RENAME COLUMN "payment_provider_id" TO "stripe_customer_id"
    `);
  }
} 
