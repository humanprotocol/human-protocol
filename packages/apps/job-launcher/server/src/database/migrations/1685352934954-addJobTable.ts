import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { NS } from '../../common/constants';

export class addJobTable1685352934954 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
          CREATE TYPE ${NS}.job_status_enum AS ENUM (
            'PENDING',
            'PAID',
            'LAUNCHED',
            'FAILED',
            'COMPLETED'
          );
        `);

    const table = new Table({
      name: `${NS}.job`,
      columns: [
        {
          name: 'id',
          type: 'serial',
          isPrimary: true,
        },
        {
          name: 'user_id',
          type: 'int',
        },
        {
          name: 'chain_id',
          type: 'varchar',
        },
        {
          name: 'manifest_url',
          type: 'varchar',
        },
        {
          name: 'manifest_hash',
          type: 'varchar',
        },
        {
          name: 'escrow_address',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'fee',
          type: 'varchar',
        },
        {
          name: 'fund_amount',
          type: 'varchar',
        },
        {
          name: 'status',
          type: `${NS}.job_status_enum`,
        },
        {
          name: 'retries_count',
          type: 'int',
          default: 0,
        },
        {
          name: 'created_at',
          type: 'timestamptz',
        },
        {
          name: 'updated_at',
          type: 'timestamptz',
        },
        {
          name: 'wait_until',
          type: 'timestamptz',
        },
      ],
      foreignKeys: [
        {
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: `${NS}.user`,
          onDelete: 'NO ACTION',
        },
      ],
    });

    await queryRunner.createTable(table, true);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(`${NS}.job`);
    await queryRunner.query(`DROP TYPE ${NS}.job_status_enum;`);
  }
}
