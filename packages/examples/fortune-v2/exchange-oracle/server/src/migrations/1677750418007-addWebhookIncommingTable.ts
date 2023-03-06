import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { NS } from "../common/constants";

export class addWebhookIncommingTable1677750418007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
        CREATE TYPE ${NS}.webhook_incomming_status_enum AS ENUM (
          'PENDING',
          'COMPLETED',
          'FAILED'
        );
      `);

    const table = new Table({
      name: `${NS}.webhook_incomming`,
      columns: [
        {
          name: "id",
          type: "serial",
          isPrimary: true,
        },
        {
          name: "signature",
          type: "varchar",
          isUnique: true,
        },
        {
          name: "chain_id",
          type: "int",
        },
        {
          name: "escrow_address",
          type: "varchar",
          isUnique: true,
        },
        {
          name: "s3_url",
          type: "varchar",
        },
        {
          name: "retries_count",
          type: "int",
          default: 0,
        },
        {
          name: "status",
          type: `${NS}.webhook_incomming_status_enum`,
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
    });

    await queryRunner.createTable(table, true);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(`${NS}.webhook_incomming`);
    await queryRunner.query(`DROP TYPE ${NS}.webhook_incomming_status_enum;`);
  }
}
