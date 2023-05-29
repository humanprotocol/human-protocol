import {MigrationInterface, QueryRunner, Table} from "typeorm";
import { NS } from "../../common/constants";

export class addPaymentTable1685352955107 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {    
        await queryRunner.query(`
          CREATE TYPE ${NS}.payment_type_enum AS ENUM (
            'DEPOSIT',
            'REFUND',
            'WITHDRAWAL'
          );
        `);

        await queryRunner.query(`
          CREATE TYPE ${NS}.payment_source_enum AS ENUM (
            'FIAT',
            'CRYPTO',
            'BALANCE'
          );
        `);
    
        const table = new Table({
          name: `${NS}.payment`,
          columns: [
            {
              name: "id",
              type: "serial",
              isPrimary: true
            },
            {
              name: "user_id",
              type: "int",
            },
            {
              name: "payment_id",
              type: "varchar",
              isNullable: true,
              default: null
            },
            {
              name: "transaction_hash",
              type: "varchar",
              isNullable: true,
              default: null
            },
            {
              name: "client_secret",
              type: "varchar",
              isNullable: true,
              default: null
            },
            {
              name: "amount",
              type: "bigint",
            },
            {
              name: "rate",
              type: "decimal",
            },
            {
              name: "currency",
              type: "varchar"
            },
            {
              name: "type",
              type: `${NS}.payment_type_enum`,
            },
            {
              name: "source",
              type: `${NS}.payment_source_enum`,
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
      }
    
      public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(`${NS}.payment`);
        await queryRunner.query(`DROP TYPE ${NS}.payment_type_enum;`);
        await queryRunner.query(`DROP TYPE ${NS}.payment_source_enum;`);
      }

}
