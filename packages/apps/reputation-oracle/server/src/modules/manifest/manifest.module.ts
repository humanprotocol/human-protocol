import { Logger, Module } from '@nestjs/common';

import { ManifestController } from './manifest.controller';
import { ManifestService } from './manifest.service';
import { Web3Module } from '../web3/web3.module';

@Module({
  imports: [Web3Module],
  controllers: [ManifestController],
  providers: [Logger, ManifestService],
  exports: [ManifestService],
})
export class ManifestModule {}
