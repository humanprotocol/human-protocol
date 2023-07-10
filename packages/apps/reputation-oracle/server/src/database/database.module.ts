import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { NS } from '../common/constants';

import { TypeOrmLoggerModule, TypeOrmLoggerService } from './typeorm';
import { WebhookIncomingEntity } from '../modules/webhook/webhook-incoming.entity';
import { ReputationEntity } from '../modules/reputation/reputation.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [TypeOrmLoggerModule, ConfigModule],
      inject: [TypeOrmLoggerService, ConfigService],
      useFactory: (
        typeOrmLoggerService: TypeOrmLoggerService,
        configService: ConfigService,
      ) => {
        typeOrmLoggerService.setOptions('all');
        return {
          name: 'default',
          type: 'postgres',
          entities: [WebhookIncomingEntity, ReputationEntity],
          // We are using migrations, synchronize should be set to false.
          synchronize: false,
          // Run migrations automatically,
          // you can disable this if you prefer running migration manually.
          migrationsTableName: NS,
          migrationsTransactionMode: 'each',
          namingStrategy: new SnakeNamingStrategy(),
          logging:
            process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'staging',
          // Allow both start:prod and start:dev to use migrations
          // __dirname is either dist or server folder, meaning either
          // the compiled js in prod or the ts in dev.
          migrations: [path.join(__dirname, '/migrations/**/*{.ts,.js}')],
          //"migrations": ["dist/migrations/*{.ts,.js}"],
          logger: typeOrmLoggerService,
          host: configService.get<string>('POSTGRES_HOST', 'localhost'),
          port: configService.get<number>('POSTGRES_PORT', 5432),
          username: configService.get<string>('POSTGRES_USER', 'operator'),
          password: configService.get<string>('POSTGRES_PASSWORD', 'qwerty'),
          database: configService.get<string>(
            'POSTGRES_DB',
            'reputation-oracle',
          ),
          keepConnectionAlive: configService.get<string>('NODE_ENV') === 'test',
          migrationsRun: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
