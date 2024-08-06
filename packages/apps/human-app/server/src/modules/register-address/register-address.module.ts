import { Module } from '@nestjs/common';
import { ReputationOracleModule } from '../../integrations/reputation-oracle/reputation-oracle.module';
import { RegisterAddressService } from './register-address.service';
import { RegisterAddressProfile } from './register-address.mapper.profile';

@Module({
  imports: [ReputationOracleModule],
  providers: [RegisterAddressService, RegisterAddressProfile],
  exports: [RegisterAddressService],
})
export class RegisterAddressModule {}
