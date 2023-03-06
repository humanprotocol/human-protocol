import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { NS } from "../common/constants";

export class addReputationOracleTable1678094031273 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
          CREATE TYPE ${NS}.reputation_oracle_type_enum AS ENUM (
            'JOB_LAUNCHER',
            'EXCHANGE_ORACLE',
            'RECORDING_ORACLE',
            'REPUTATION_ORACLE'
          );
        `);

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
          name: "public_key",
          type: "varchar",
        },
        {
          name: "reputation_points",
          type: "int",
        },
        {
          name: "type",
          type: `${NS}.reputation_oracle_type_enum`,
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
    await queryRunner.query(`DROP TYPE ${NS}.reputation_oracle_type_enum;`);
  }
}
