import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAudioAttributeAnnotation1756902190591
  implements MigrationInterface
{
  name = 'AddAudioAttributeAnnotation1756902190591';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "hmt"."jobs_request_type_enum"
            RENAME TO "jobs_request_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_request_type_enum" AS ENUM(
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
            ALTER COLUMN "request_type" TYPE "hmt"."jobs_request_type_enum" USING "request_type"::"text"::"hmt"."jobs_request_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "hmt"."jobs_request_type_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "hmt"."jobs_request_type_enum_old" AS ENUM(
                'audio_transcription',
                'fortune',
                'hcaptcha',
                'image_boxes',
                'image_boxes_from_points',
                'image_points',
                'image_polygons',
                'image_skeletons_from_boxes'
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
