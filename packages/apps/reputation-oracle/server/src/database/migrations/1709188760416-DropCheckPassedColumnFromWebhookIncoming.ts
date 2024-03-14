import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropCheckPassedColumnFromWebhookIncoming1709188760416
  implements MigrationInterface
{
  name = 'DropCheckPassedColumnFromWebhookIncoming1709188760416';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('hmt.webhook_incoming', 'check_passed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'hmt.webhook_incoming',
      new TableColumn({
        name: 'check_passed',
        type: 'boolean',
        isNullable: true,
      }),
    );
  }
}
