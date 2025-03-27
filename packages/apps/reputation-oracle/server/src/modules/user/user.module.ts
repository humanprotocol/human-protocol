import { Module } from '@nestjs/common';

import { HCaptchaModule } from '../../integrations/hcaptcha/hcaptcha.module';

import { Web3Module } from '../web3/web3.module';

import { SiteKeyRepository } from './site-key.repository';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [Web3Module, HCaptchaModule],
  providers: [UserService, UserRepository, SiteKeyRepository],
  controllers: [UserController],
  exports: [SiteKeyRepository, UserService, UserRepository],
})
export class UserModule {}
