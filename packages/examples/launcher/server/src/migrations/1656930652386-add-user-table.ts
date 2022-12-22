import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { NS } from "../common/constants";

export class addUserTable1656930652386 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
      CREATE TYPE ${NS}.user_type_enum AS ENUM (
        'OPERATOR',
        'REQUESTER'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE ${NS}.user_status_enum AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'PENDING'
      );
    `);

    const table = new Table({
      name: `${NS}.user`,
      columns: [
        {
          name: "id",
          type: "serial",
          isPrimary: true,
        },
        {
          name: "password",
          type: "varchar",
        },
        {
          name: "username",
          type: "varchar",
          isNullable: true,
          isUnique: true,
        },
        {
          name: "email",
          type: "varchar",
          isUnique: true,
          isNullable: true,
        },
        {
          name: "token_address",
          type: "varchar",
          isUnique: true,
          isNullable: true,
        },
        {
          name: "socket_id",
          type: "varchar",
          isNullable: true,
        },
        {
          name: "type",
          type: `${NS}.user_type_enum`,
        },
        {
          name: "status",
          type: `${NS}.user_status_enum`,
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
    await queryRunner.dropTable(`${NS}.user`);
    await queryRunner.query(`DROP TYPE ${NS}.user_type_enum;`);
    await queryRunner.query(`DROP TYPE ${NS}.user_status_enum;`);
  }
}
