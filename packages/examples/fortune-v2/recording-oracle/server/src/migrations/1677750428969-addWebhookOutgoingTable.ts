import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { NS } from "../common/constants";

export class addWebhookOutgoingTable1677750428969 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const table = new Table({
      name: `${NS}.webhook_outgoing`,
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
          name: "endpoint_url",
          type: "varchar",
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
    });

    await queryRunner.createTable(table, true);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(`${NS}.webhook_outgoing`);
  }
}
