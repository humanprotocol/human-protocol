import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CredentialService } from './credential.service';
import { CredentialRepository } from './credential.repository';
import { Web3Module } from '../web3/web3.module'; // Assuming integration with blockchain
import { UserModule } from '../user/user.module';

@Module({
  imports: [ConfigModule, Web3Module, UserModule],
  providers: [Logger, CredentialService, CredentialRepository],
  exports: [CredentialService],
})
export class CredentialModule {}
