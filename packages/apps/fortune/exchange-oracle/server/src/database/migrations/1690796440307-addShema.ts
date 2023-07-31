import { NS } from "src/common/constants";
import { MigrationInterface, QueryRunner } from "typeorm"

export class AddShema1690796440307 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createSchema(NS, true);
    }
    
    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropSchema(NS);
    }
}
