import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifySignature } from '../utils/signature';
import { HEADER_SIGNATURE_KEY } from '../constants';
import { EscrowUtils } from '@human-protocol/sdk';
import { Role } from '../enums/role';

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
      if (this.role.includes(Role.JobLauncher) && escrowData.launcher?.length)
        oracleAdresses.push(escrowData.launcher);
      if (
        this.role.includes(Role.Exchange) &&
        escrowData.exchangeOracle?.length
      )
        oracleAdresses.push(escrowData.exchangeOracle);
      if (
        this.role.includes(Role.Reputation) &&
        escrowData.reputationOracle?.length
      )
        oracleAdresses.push(escrowData.reputationOracle);

      const isVerified = verifySignature(data, signature, oracleAdresses);

      if (isVerified) {
        return true;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
