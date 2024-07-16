import { Module } from '@nestjs/common';
import { KvStoreGateway } from './kv-store.gateway';

@Module({
  providers: [KvStoreGateway],
  exports: [KvStoreGateway],
})
export class KvStoreModule {}
