import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExternalApiGateway } from './external-api.gateway';
import { ExternalApiProfile } from './external-api.mapper';

@Module({
  imports: [HttpModule],
  providers: [ExternalApiGateway, ExternalApiProfile],
  exports: [ExternalApiGateway],
})
export class ExternalApiModule {}
