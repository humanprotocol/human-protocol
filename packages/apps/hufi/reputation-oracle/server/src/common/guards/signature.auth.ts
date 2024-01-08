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
        data.chainId,
        data.escrowAddress,
      );
      if (this.role.includes(Role.JobLaucher))
        oracleAdresses.push(escrowData.launcher);
      if (this.role.includes(Role.Exchange))
        oracleAdresses.push(escrowData.exchangeOracle!);
      if (this.role.includes(Role.Recording))
        oracleAdresses.push(escrowData.recordingOracle!);

      const isVerified = verifySignature(data, signature, oracleAdresses);

      if (isVerified) {
        return true;
      }
    } catch (error) {
      console.error(error);
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
