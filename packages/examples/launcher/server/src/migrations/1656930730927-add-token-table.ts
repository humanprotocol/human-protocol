import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { NS } from "../common/constants";

export class addTokenTable1656930730927 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      CREATE TYPE ${NS}.token_type_enum AS ENUM (
        'EMAIL',
        'PASSWORD'
      );
    `);

    const table = new Table({
      name: `${NS}.token`,
      columns: [
        {
          name: "id",
          type: "serial",
          isPrimary: true,
        },
        {
          name: "uuid",
          type: "uuid",
          isUnique: true,
          isGenerated: true,
          generationStrategy: "uuid",
        },
        {
          name: "token_type",
          type: `${NS}.token_type_enum`,
        },
        {
          name: "user_id",
          type: "int",
        },
        {
          name: "created_at",
          type: "timestamptz",
        },
        {
          name: "updated_at",
          type: "timestamptz",
        },
      ],
      foreignKeys: [
        {
          columnNames: ["user_id"],
          referencedColumnNames: ["id"],
          referencedTableName: `${NS}.user`,
          onDelete: "CASCADE",
        },
      ],
    });

    await queryRunner.createTable(table, true);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION delete_expired_tokens() RETURNS trigger
      LANGUAGE plpgsql
      AS $$
        BEGIN
          DELETE FROM ${NS}.token WHERE created_at < NOW() - INTERVAL '1 hour';
          RETURN NEW;
        END;
      $$;
    `);

    await queryRunner.query(`
      CREATE TRIGGER delete_expired_tokens_trigger
      AFTER INSERT ON ${NS}.token
      EXECUTE PROCEDURE delete_expired_tokens()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(`${NS}.token`);
    await queryRunner.query(`DROP TYPE ${NS}.token_type_enum;`);
    await queryRunner.query("DROP FUNCTION delete_expired_tokens();");
  }
}
