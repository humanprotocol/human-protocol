import { Module } from '@nestjs/common';

import { HCaptchaModule } from '../../integrations/hcaptcha/hcaptcha.module';
import { Web3Module } from '../web3/web3.module';

import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';
import { SiteKeyRepository } from './site-key.repository';

@Module({
  imports: [Web3Module, HCaptchaModule],
  providers: [UserService, UserRepository, SiteKeyRepository],
  controllers: [UserController],
  exports: [UserService, UserRepository],
})
export class UserModule {}
