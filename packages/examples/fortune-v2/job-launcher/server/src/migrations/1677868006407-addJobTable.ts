import {MigrationInterface, QueryRunner, Table} from "typeorm";
import { NS } from "../common/constants";

export class addJobTable1677868006407 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
          CREATE TYPE ${NS}.job_mode_enum AS ENUM (
            'BATCH',
            'DESCRIPTIVE'
          );
        `);
    
        await queryRunner.query(`
          CREATE TYPE ${NS}.job_request_type_enum AS ENUM (
            'IMAGE_LABEL_BINARY',
            'FORTUNE'
          );
        `);
    
        await queryRunner.query(`
          CREATE TYPE ${NS}.job_status_enum AS ENUM (
            'PENDING',
            'LAUNCHED',
            'FAILED',
            'COMPLETED'
          );
        `);
    
        const table = new Table({
          name: `${NS}.job`,
          columns: [
            {
              name: "id",
              type: "serial",
              isPrimary: true
            },
            {
              name: "user_id",
              type: "int"
            },
            {
              name: "chain_id",
              type: "varchar"
            },
            {
              name: "submissions_required",
              type: "int",
            },
            {
              name: "requester_title",
              type: "varchar",
              isNullable: true,
            },
            {
              name: "requester_description",
              type: "varchar",
            },
            {
              name: "price",
              type: "decimal"
            },
            {
              name: "labels",
              type: "varchar[]",
              isNullable: true,
            },
            {
              name: "data_url",
              type: "varchar",
              isNullable: true,
            },
            {
              name: "requester_accuracy_target",
              type: "decimal",
              isNullable: true,
            },
            {
              name: "escrow_address",
              type: "varchar",
              isNullable: true,
            },
            {
              name: "mode",
              type: `${NS}.job_mode_enum`,
            },
            {
              name: "request_type",
              type: `${NS}.job_request_type_enum`,
            },
            {
              name: "status",
              type: `${NS}.job_status_enum`,
            },
            {
              name: "retries_count",
              type: "int",
              default: 0,
            },
            {
              name: "created_at",
              type: "timestamptz",
            },
            {
              name: "updated_at",
              type: "timestamptz",
            },
            {
              name: "wait_until",
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
        await queryRunner.dropTable(`${NS}.job`);
        await queryRunner.query(`DROP TYPE ${NS}.job_mode_enum;`);
        await queryRunner.query(`DROP TYPE ${NS}.job_request_type_enum;`);
        await queryRunner.query(`DROP TYPE ${NS}.job_status_enum;`);
      }

}
