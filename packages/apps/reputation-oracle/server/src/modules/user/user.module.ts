import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';
import { Web3Module } from '../web3/web3.module';
import { SiteKeyRepository } from './site-key.repository';
import { SiteKeyEntity } from './site-key.entity';
import { HCaptchaModule } from '../../integrations/hcaptcha/hcaptcha.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SiteKeyEntity]),
    ConfigModule,
    Web3Module,
    HCaptchaModule,
  ],
  providers: [Logger, UserService, UserRepository, SiteKeyRepository],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
