import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Module
} from '@nestjs/common';
import { verifySignature } from '../utils/signature';
import { HEADER_SIGNATURE_KEY } from '../constant';
import { EscrowUtils } from '@human-protocol/sdk';
import { Role } from '../enums/role';

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor(private role: Role[]) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const data = request.body;
    const signature = request.headers[HEADER_SIGNATURE_KEY];

    if (this.role.includes(Role.Worker)) {
      const isVerified = verifySignature(data, signature, []);
      if (isVerified) {
        return true;
      }
    } else {
      try {
        const escrowData = await EscrowUtils.getEscrow(
          data.chain_id,
          data.escrow_address,
        );
        const oracleAddresses: string[] = [];
        if (this.role.includes(Role.JobLauncher)) {
          oracleAddresses.push(escrowData.launcher);
        }
        if (this.role.includes(Role.Recording)) {
          oracleAddresses.push(escrowData.recordingOracle!);
        }
        if (this.role.includes(Role.Reputation)) {
          oracleAddresses.push(escrowData.reputationOracle!);
        }

        const isVerified = verifySignature(data, signature, oracleAddresses);
        if (isVerified) {
          return true;
        }
      } catch (error) {
        console.error(error);
      }
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
