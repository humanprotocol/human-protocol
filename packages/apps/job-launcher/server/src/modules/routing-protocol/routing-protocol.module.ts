import { Module } from '@nestjs/common';
import { RoutingProtocolService } from './routing-protocol.service';
import { Web3Module } from '../web3/web3.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [Web3Module, ConfigModule],
  providers: [RoutingProtocolService],
  exports: [RoutingProtocolService],
})
export class RoutingProtocolModule {}
