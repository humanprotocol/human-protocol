import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UserModule } from '../user/user.module';
import { JwtHttpStrategy } from './strategy';
import { AuthService } from './auth.service';
import { AuthJwtController } from './auth.controller';
import { TokenRepository } from './token.repository';
import { UserRepository } from '../user/user.repository';
import { Web3Module } from '../web3/web3.module';
import { AuthConfigService } from '../../config/auth-config.service';
import { HCaptchaModule } from '../../integrations/hcaptcha/hcaptcha.module';
import { EmailModule } from '../email/module';

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
    EmailModule,
  ],
  providers: [JwtHttpStrategy, AuthService, TokenRepository, UserRepository],
  controllers: [AuthJwtController],
  exports: [AuthService],
})
export class AuthModule {}
