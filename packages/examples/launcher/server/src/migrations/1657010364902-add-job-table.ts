import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { NS } from "../common/constants";

export class addJobTable1657010364902 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      CREATE TYPE ${NS}.job_mode_enum AS ENUM (
        'BATCH'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE ${NS}.job_request_type_enum AS ENUM (
        'IMAGE_LABEL_BINARY'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE ${NS}.job_status_enum AS ENUM (
        'PENDING',
        'PAID',
        'ESCROW_CREATED',
        'ESCROW_SETUP',
        'LAUNCHED',
        'COMPLETE',
        'CANCELLED',
        'REJECTED'
      );
    `);

    const table = new Table({
      name: `${NS}.job`,
      columns: [
        {
          name: "id",
          type: "serial",
          isPrimary: true,
        },
        {
          name: "user_id",
          type: "int",
          isNullable: true,
        },
        {
          name: "network_id",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "dataset_length",
          type: "int",
        },
        {
          name: "labels",
          type: "varchar[]",
        },
        {
          name: "annotations_per_image",
          type: "int",
        },
        {
          name: "data_url",
          type: "varchar",
        },
        {
          name: "data",
          type: "text",
        },
        {
          name: "manifest_hash",
          type: "varchar",
        },
        {
          name: "requester_description",
          type: "varchar",
        },
        {
          name: "requester_accuracy_target",
          type: "decimal",
        },
        {
          name: "recording_oracle_address",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "reputation_oracle_address",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "exchange_oracle_address",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "recording_oracle_url",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "reputation_oracle_url",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "exchange_oracle_url",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "recording_oracle_stake",
          type: "decimal",
          isNullable: true,
        },
        {
          name: "reputation_oracle_stake",
          type: "decimal",
          isNullable: true,
        },
        {
          name: "token_address",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "escrow_address",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "price",
          type: "decimal",
          isNullable: true,
        },
        {
          name: "fee",
          type: "decimal",
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
    await queryRunner.dropTable(`${NS}.job`);
    await queryRunner.query(`DROP TYPE ${NS}.job_mode_enum;`);
    await queryRunner.query(`DROP TYPE ${NS}.job_request_type_enum;`);
    await queryRunner.query(`DROP TYPE ${NS}.job_status_enum;`);
  }
}
