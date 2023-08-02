import { NS } from "src/common/constants";
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1690873167904 implements MigrationInterface {
    name = 'InitialMigration1690873167904'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createSchema(NS, true);
        await queryRunner.query(`CREATE TYPE "hmt"."user_type_enum" AS ENUM('OPERATOR', 'REQUESTER')`);
        await queryRunner.query(`CREATE TYPE "hmt"."user_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING')`);
        await queryRunner.query(`CREATE TABLE "hmt"."user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "password" character varying NOT NULL, "email" character varying, "stripeCustomerId" character varying, "type" "hmt"."user_type_enum" NOT NULL, "status" "hmt"."user_status_enum" NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_0bfe583759eb0305b60117be840" UNIQUE ("stripeCustomerId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "hmt"."token_tokentype_enum" AS ENUM('EMAIL', 'PASSWORD')`);
        await queryRunner.query(`CREATE TABLE "hmt"."token" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "tokenType" "hmt"."token_tokentype_enum" NOT NULL, "userId" integer NOT NULL, CONSTRAINT "UQ_a9a66098c2fb758dff713f8d838" UNIQUE ("uuid"), CONSTRAINT "REL_94f168faad896c0786646fa3d4" UNIQUE ("userId"), CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "hmt"."auth_status_enum" AS ENUM('ACTIVE', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "hmt"."auth" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "refreshToken" character varying NOT NULL, "refreshTokenExpiresAt" bigint NOT NULL, "status" "hmt"."auth_status_enum" NOT NULL, "userId" integer NOT NULL, "ip" character varying NOT NULL, CONSTRAINT "REL_373ead146f110f04dad6084815" UNIQUE ("userId"), CONSTRAINT "PK_7e416cf6172bc5aec04244f6459" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hmt"."token" ADD CONSTRAINT "FK_94f168faad896c0786646fa3d4a" FOREIGN KEY ("userId") REFERENCES "hmt"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hmt"."auth" ADD CONSTRAINT "FK_373ead146f110f04dad60848154" FOREIGN KEY ("userId") REFERENCES "hmt"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hmt"."auth" DROP CONSTRAINT "FK_373ead146f110f04dad60848154"`);
        await queryRunner.query(`ALTER TABLE "hmt"."token" DROP CONSTRAINT "FK_94f168faad896c0786646fa3d4a"`);
        await queryRunner.query(`DROP TABLE "hmt"."auth"`);
        await queryRunner.query(`DROP TYPE "hmt"."auth_status_enum"`);
        await queryRunner.query(`DROP TABLE "hmt"."token"`);
        await queryRunner.query(`DROP TYPE "hmt"."token_tokentype_enum"`);
        await queryRunner.query(`DROP TABLE "hmt"."user"`);
        await queryRunner.query(`DROP TYPE "hmt"."user_status_enum"`);
        await queryRunner.query(`DROP TYPE "hmt"."user_type_enum"`);
    }

}
