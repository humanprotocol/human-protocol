import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthConfigService } from '@/config';
import { HCaptchaModule } from '@/integrations/hcaptcha';
import { EmailModule } from '@/modules/email';
import { ExchangeModule } from '@/modules/exchange';
import { ExchangeApiKeysModule } from '@/modules/exchange-api-keys';
import { UserModule } from '@/modules/user';
import { Web3Module } from '@/modules/web3';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtHttpStrategy } from './jwt-http-strategy';
import { TokenRepository } from './token.repository';

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
    Web3Module,
    HCaptchaModule,
    ExchangeModule,
    ExchangeApiKeysModule,
    EmailModule,
  ],
  providers: [JwtHttpStrategy, AuthService, TokenRepository],
  controllers: [AuthController],
  exports: [TokenRepository],
})
export class AuthModule {}
