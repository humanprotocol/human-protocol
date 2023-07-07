import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { NS } from '../../common/constants';

export class addReputationTable1678094042234 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
        CREATE TYPE ${NS}.reputation_type_enum AS ENUM (
          'WORKER',
          'JOB_LAUNCHER',
          'EXCHANGE_ORACLE',
          'RECORDING_ORACLE',
          'REPUTATION_ORACLE'
        );
      `);

    const table = new Table({
      name: `${NS}.reputation`,
      columns: [
        {
          name: 'id',
          type: 'serial',
          isPrimary: true,
        },
        {
          name: 'chain_id',
          type: 'int',
        },
        {
          name: 'address',
          type: 'varchar',
        },
        {
          name: 'reputation_points',
          type: 'int',
        },
        {
          name: 'type',
          type: `${NS}.reputation_type_enum`,
        },
        {
          name: 'created_at',
          type: 'timestamptz',
        },
        {
          name: 'updated_at',
          type: 'timestamptz',
        },
      ],
    });

    await queryRunner.createTable(table, true);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(`${NS}.reputation`);
    await queryRunner.query(`DROP TYPE ${NS}.reputation_type_enum;`);
  }
}
