import { MigrationInterface, QueryRunner } from "typeorm"

export class AddBalanceConstraintAndTrigger1691092442163 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create trigger function to update user's balance on "hmt"."payments" insertion
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_user_balance_on_insert()
            RETURNS TRIGGER AS
            $$
            BEGIN
                UPDATE "hmt"."users" AS u
                SET balance = (
                    SELECT COALESCE(SUM(amount * rate), 0)
                    FROM "hmt"."payments"
                    WHERE user_id = NEW.user_id
                )
                WHERE u.id = NEW.user_id;
                RETURN NEW;
            END;
            $$
            LANGUAGE plpgsql;
        `);

        // Create trigger to call the trigger function on "hmt"."payments" insertion
        await queryRunner.query(`
            CREATE TRIGGER trigger_update_user_balance_on_insert
            AFTER INSERT ON "hmt"."payments"
            FOR EACH ROW
            EXECUTE FUNCTION update_user_balance_on_insert();
        `);

        // Calculate the initial balance for each user based on their transactions
        await queryRunner.query(`
            UPDATE "hmt"."users" AS u
            SET balance = (
                SELECT COALESCE(SUM(amount * rate), 0)
                FROM "hmt"."payments"
                WHERE user_id = u.id
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            ADD CONSTRAINT chk_non_negative_balance
            CHECK (balance >= 0)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_user_balance_on_insert ON "hmt"."payments";
        `);

        await queryRunner.query(`
            DROP FUNCTION IF EXISTS update_user_balance_on_insert();
        `);

        await queryRunner.query(`
            ALTER TABLE "hmt"."users"
            DROP CONSTRAINT IF EXISTS chk_non_negative_balance
        `);
    }
}
