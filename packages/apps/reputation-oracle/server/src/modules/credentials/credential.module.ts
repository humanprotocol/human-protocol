import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { CredentialService } from './credential.service';
import { CredentialEntity } from './credential.entity';
import { CredentialRepository } from './credential.repository';
// import { CredentialController } from './credential.controller';
import { Web3Module } from '../web3/web3.module'; // Assuming integration with blockchain

@Module({
  imports: [
    TypeOrmModule.forFeature([CredentialEntity]),
    ConfigModule,
    Web3Module,
  ],
  providers: [Logger, CredentialService, CredentialRepository],
  //   controllers: [CredentialController],
  exports: [CredentialService],
})
export class CredentialModule {}
