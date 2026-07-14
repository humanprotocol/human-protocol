import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCvatTypes1784028614177 implements MigrationInterface {
  name = 'AddCvatTypes1784028614177';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_request_type_enum"
            RENAME TO "jobs_request_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_request_type_enum" AS ENUM(
                'image_label_binary',
                'image_points',
                'image_polygons',
                'image_boxes',
                'image_boxes_from_points',
                'image_skeletons_from_boxes',
                'audio_transcription',
                'fortune',
                'hcaptcha',
                'audio_attribute_annotation'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "request_type" TYPE "hmt"."jobs_request_type_enum" USING "request_type"::"text"::"hmt"."jobs_request_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_request_type_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_request_type_enum_old" AS ENUM(
                'image_points',
                'image_polygons',
                'image_boxes',
                'image_boxes_from_points',
                'image_skeletons_from_boxes',
                'fortune',
                'hcaptcha',
                'audio_transcription',
                'audio_attribute_annotation'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "hmt"."jobs"
            ALTER COLUMN "request_type" TYPE "hmt"."jobs_request_type_enum_old" USING "request_type"::"text"::"hmt"."jobs_request_type_enum_old"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_request_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_request_type_enum_old"
            RENAME TO "jobs_request_type_enum"
        `);
  }
}
