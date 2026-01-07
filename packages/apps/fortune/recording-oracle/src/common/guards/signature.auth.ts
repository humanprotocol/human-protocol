import { EscrowUtils } from '@human-protocol/sdk';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ethers } from 'ethers';

import { HEADER_SIGNATURE_KEY } from '../constants';
import { Role } from '../enums/role';
import { AuthError, ValidationError } from '../errors';
import { verifySignature } from '../utils/signature';

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor(private role: Role[]) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const data = request.body;
    if (!data.chain_id || !ethers.isAddress(data.escrow_address)) {
      throw new HttpException('Invalid payload', HttpStatus.BAD_REQUEST);
    }

    const signature = request.headers[HEADER_SIGNATURE_KEY];
    const oracleAdresses: string[] = [];
    try {
      const escrowData = await EscrowUtils.getEscrow(
        data.chain_id,
        data.escrow_address,
      );
      if (!escrowData) {
        throw new ValidationError('Escrow not found');
      }

      if (this.role.includes(Role.JobLauncher))
        oracleAdresses.push(escrowData.launcher);
      if (this.role.includes(Role.Exchange) && escrowData.exchangeOracle)
        oracleAdresses.push(escrowData.exchangeOracle);
      if (this.role.includes(Role.Reputation) && escrowData.reputationOracle)
        oracleAdresses.push(escrowData.reputationOracle);

      const isVerified = verifySignature(data, signature, oracleAdresses);

      if (isVerified) {
        return true;
      }
    } catch (error: any) {
      throw new ValidationError(error.message);
    }

    throw new AuthError('Unauthorized');
  }
}
