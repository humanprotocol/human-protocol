import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExternalApiProfile } from './external-api-profile.service';
import { ExternalApiGateway } from './external-api.gateway';

@Module({
  imports: [HttpModule],
  providers: [ExternalApiGateway, ExternalApiProfile],
  exports: [ExternalApiGateway],
})
export class ExternalApiModule {}
