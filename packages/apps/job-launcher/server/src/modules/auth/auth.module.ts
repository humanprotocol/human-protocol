import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { JwtHttpStrategy } from './strategy';
import { AuthService } from './auth.service';
import { AuthJwtController } from './auth.controller';
import { TokenEntity } from './token.entity';
import { TokenRepository } from './token.repository';
import { ConfigNames } from '../../common/config';
import { SendGridModule } from '../sendgrid/sendgrid.module';
import { ApiKeyRepository } from './apikey.repository';
import { ApiKeyEntity } from './apikey.entity';
import { UserEntity } from '../user/user.entity';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [
    UserModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        privateKey: configService.get<string>(ConfigNames.JWT_PRIVATE_KEY),
        signOptions: {
          algorithm: 'ES256',
          expiresIn: configService.get<number>(
            ConfigNames.JWT_ACCESS_TOKEN_EXPIRES_IN,
            3600,
          ),
        },
      }),
    }),
    TypeOrmModule.forFeature([TokenEntity, ApiKeyEntity, UserEntity]),
    SendGridModule,
  ],
  providers: [
    JwtHttpStrategy,
    AuthService,
    TokenRepository,
    ApiKeyRepository,
    UserRepository,
  ],
  controllers: [AuthJwtController],
  exports: [AuthService],
})
export class AuthModule {}
