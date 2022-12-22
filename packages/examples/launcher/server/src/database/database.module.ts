import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import ormconfig from "../ormconfig";
import { TypeOrmLoggerModule, TypeOrmLoggerService } from "./typeorm";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [TypeOrmLoggerModule, ConfigModule],
      inject: [TypeOrmLoggerService, ConfigService],
      useFactory: (typeOrmLoggerService: TypeOrmLoggerService, configService: ConfigService) => {
        typeOrmLoggerService.setOptions("all");
        return {
          ...ormconfig,
          logger: typeOrmLoggerService,
          host: configService.get<string>("POSTGRES_HOST", "postgres-db"),
          port: configService.get<number>("POSTGRES_PORT", 5432),
          username: configService.get<string>("POSTGRES_USER", "hmt"),
          password: configService.get<string>("POSTGRES_PASSWORD", "qwerty"),
          database: configService.get<string>("POSTGRES_DB", "hmt"),
          keepConnectionAlive: configService.get<string>("NODE_ENV") === "test",
          migrationsRun: configService.get<string>("MIGRATIONS_RUN") === "true"
        };
      },
    }),
  ],
})
export class DatabaseModule {}
