import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { JwtHttpStrategy } from './strategy';
import { AuthService } from './auth.service';
import { AuthJwtController } from './auth.controller';
import { TokenEntity } from './token.entity';
import { TokenRepository } from './token.repository';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { SendGridModule } from '../sendgrid/sendgrid.module';
import { ApiKeyRepository } from './apikey.repository';
import { ApiKeyEntity } from './apikey.entity';
import { UserEntity } from '../user/user.entity';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      inject: [AuthConfigService],
      useFactory: (authConfigService: AuthConfigService) => ({
        privateKey: authConfigService.jwtPrivateKey,
        signOptions: {
          algorithm: 'ES256',
          expiresIn: authConfigService.accessTokenExpiresIn,
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
