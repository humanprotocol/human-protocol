import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialService } from './credential.service';
import { CredentialRepository } from './credential.repository';
import { CredentialController } from './credential.controller';
import {
  CredentialEntity,
  CredentialValidationEntity,
} from './credential.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CredentialEntity, CredentialValidationEntity]),
    UserModule,
  ],
  controllers: [CredentialController],
  providers: [CredentialService, CredentialRepository, Logger],
  exports: [CredentialService],
})
export class CredentialModule {}
