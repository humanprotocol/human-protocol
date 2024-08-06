import { TokenRefreshService } from './token-refresh.service';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { TokenRefreshProfile } from './token-refresh.mapper.profile';
import { Module } from '@nestjs/common';

@Module({
  imports: [ReputationOracleModule],
  providers: [TokenRefreshService, TokenRefreshProfile],
  exports: [TokenRefreshService],
})
export class TokenRefreshModule {}
