import { EscrowUtils } from '@human-protocol/sdk';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
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
    const signature = request.headers[HEADER_SIGNATURE_KEY];
    const oracleAdresses: string[] = [];
    try {
      const escrowData = await EscrowUtils.getEscrow(
        data.chain_id,
        data.escrow_address,
      );

      if (this.role.includes(Role.JobLauncher) && escrowData?.launcher?.length)
        oracleAdresses.push(escrowData.launcher);
      if (
        this.role.includes(Role.Exchange) &&
        escrowData?.exchangeOracle?.length
      )
        oracleAdresses.push(escrowData.exchangeOracle);
      if (
        this.role.includes(Role.Reputation) &&
        escrowData?.reputationOracle?.length
      )
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
