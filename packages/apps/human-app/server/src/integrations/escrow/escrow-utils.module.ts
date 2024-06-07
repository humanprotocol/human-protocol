import { Module } from '@nestjs/common';
import { EscrowUtilsGateway } from './escrow-utils-gateway.service';

@Module({
  providers: [EscrowUtilsGateway],
  exports: [EscrowUtilsGateway],
})
export class EscrowUtilsModule {}
