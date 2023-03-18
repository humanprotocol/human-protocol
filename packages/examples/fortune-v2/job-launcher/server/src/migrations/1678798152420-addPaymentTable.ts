import {MigrationInterface, QueryRunner, Table} from "typeorm";
import { NS } from "../common/constants";

export class addPaymentTable1678798152420 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {    
        await queryRunner.query(`
          CREATE TYPE ${NS}.payment_status_enum AS ENUM (
            'CANCELED',
            'PROCESSING',
            'REQUIRES_ACTION',
            'REQUIRES_CAPTURE',
            'REQUIRES_CONFIRMATION',
            'REQUIRES_PAYMENT_METHOD',
            'SUCCEEDED'
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
              name: "job_id",
              type: "int",
            },
            {
              name: "payment_id",
              type: "varchar"
            },
            {
              name: "amount",
              type: "int",
            },
            {
              name: "client_secret",
              type: "varchar"
            },
            {
              name: "customer",
              type: "varchar"
            },
            {
              name: "error_message",
              type: "text"
            },
            {
              name: "currency",
              type: "varchar"
            },
            {
              name: "method_type",
              type: "varchar",
            },
            {
              name: "status",
              type: `${NS}.payment_status_enum`,
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
              columnNames: ["job_id"],
              referencedColumnNames: ["id"],
              referencedTableName: `${NS}.job`,
              onDelete: "CASCADE",
            },
          ],
        });
    
        await queryRunner.createTable(table, true);
      }
    
      public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable(`${NS}.payment`);
        await queryRunner.query(`DROP TYPE ${NS}.payment_status_enum;`);
      }

}
