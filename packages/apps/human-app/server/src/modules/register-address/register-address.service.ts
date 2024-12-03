import { Injectable } from '@nestjs/common';
import {
  RegisterAddressCommand,
  RegisterAddressResponse,
} from './model/register-address.model';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';

@Injectable()
export class RegisterAddressService {
  constructor(private gateway: ReputationOracleGateway) {}
  registerBlockchainAddress(
    command: RegisterAddressCommand,
  ): Promise<RegisterAddressResponse> {
    return this.gateway.sendBlockchainAddressRegistration(command);
  }
}
