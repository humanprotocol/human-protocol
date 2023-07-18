import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { NS } from '../../common/constants';

export class addWebhookIncomingTable1678011588667
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
        CREATE TYPE ${NS}.webhook_incoming_status_enum AS ENUM (
          'PENDING',
          'PAID',
          'COMPLETED',
          'FAILED'
        );
      `);

    const table = new Table({
      name: `${NS}.webhook_incoming`,
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
          name: 'escrow_address',
          type: 'varchar',
        },
        {
          name: 'results_url',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'check_passed',
          type: 'boolean',
          isNullable: true,
        },
        {
          name: 'retries_count',
          type: 'int',
          default: 0,
        },
        {
          name: 'status',
          type: `${NS}.webhook_incoming_status_enum`,
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
    });

    await queryRunner.createTable(table, true);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(`${NS}.webhook_incoming`);
    await queryRunner.query(`DROP TYPE ${NS}.webhook_incoming_status_enum;`);
  }
}
