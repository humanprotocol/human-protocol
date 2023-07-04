import { MigrationInterface, QueryRunner } from 'typeorm';
import { NS } from '../../common/constants';

export class addShema1677845576145 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createSchema(NS, true);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropSchema(NS);
  }
}
