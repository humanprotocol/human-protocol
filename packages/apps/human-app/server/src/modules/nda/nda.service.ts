import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import {
  GetNDACommand,
  GetNDAResponse,
  SignNDACommand,
  SignNDAResponse,
} from './model/nda.model';

@Injectable()
export class NDAService {
  constructor(private readonly gateway: ReputationOracleGateway) {}

  async getLatestNDA(command: GetNDACommand): Promise<GetNDAResponse> {
    return this.gateway.getLatestNDA(command);
  }

  async signNDA(command: SignNDACommand): Promise<SignNDAResponse> {
    return await this.gateway.sendSignedNDA(command);
  }
}
