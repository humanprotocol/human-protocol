import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { NS } from "../common/constants";

export class addReputationWorkerTable1678094042234 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const table = new Table({
      name: `${NS}.reputation_oracle`,
      columns: [
        {
          name: "id",
          type: "serial",
          isPrimary: true,
        },
        {
          name: "chain_id",
          type: "int",
        },
        {
          name: "address",
          type: "varchar",
        },
        {
          name: "reputation_points",
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
    });

    await queryRunner.createTable(table, true);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(`${NS}.reputation_oracle`);
  }
}
