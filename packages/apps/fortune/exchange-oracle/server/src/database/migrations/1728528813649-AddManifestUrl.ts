import { MigrationInterface, QueryRunner } from "typeorm";

export class AddManifestUrl1728528813649 implements MigrationInterface {
    name = 'AddManifestUrl1728528813649'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "manifest_url"
            SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "manifest_url" DROP NOT NULL
        `);
    }

}
