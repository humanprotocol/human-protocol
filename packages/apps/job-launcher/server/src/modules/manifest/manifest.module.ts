import { Module } from '@nestjs/common';
import { ManifestService } from './manifest.service';
import { StorageModule } from '../storage/storage.module';
import { Web3Module } from '../web3/web3.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { RoutingProtocolModule } from '../routing-protocol/routing-protocol.module';
import { RateModule } from '../rate/rate.module';
import { QualificationModule } from '../qualification/qualification.module';

@Module({
  imports: [
    StorageModule,
    Web3Module,
    EncryptionModule,
    RoutingProtocolModule,
    RateModule,
    QualificationModule,
  ],
  providers: [ManifestService],
  exports: [ManifestService],
})
export class ManifestModule {}
