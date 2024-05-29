import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifySignature } from '../utils/signature';
import { HEADER_SIGNATURE_KEY } from '../constant';
import { EscrowUtils } from '@human-protocol/sdk';
import { Role } from '../enums/role';

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor(private readonly roles: Role[]) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const data = request.body;
    const signature = request.headers[HEADER_SIGNATURE_KEY];

    try {
      const addresses: string[] = [];

      if (this.roles.includes(Role.Worker)) {
        const workerAddress = request.user?.address;
        if (!workerAddress) {
          throw new UnauthorizedException('User address not found');
        }
        addresses.push(workerAddress);
      } else {
        const escrowData = await EscrowUtils.getEscrow(
          data.chain_id,
          data.escrow_address,
        );
        console.log('Escrow Data:', escrowData);

        if (this.roles.includes(Role.JobLauncher)) {
          addresses.push(escrowData.launcher);
        }
        if (this.roles.includes(Role.Recording)) {
          addresses.push(escrowData.recordingOracle!);
        }
        if (this.roles.includes(Role.Reputation)) {
          addresses.push(escrowData.reputationOracle!);
        }
      }

      const isVerified = verifySignature(data, signature, addresses);
      console.log('Verification result:', isVerified);

      if (isVerified) {
        return true;
      }

      console.log('Verification failed');
      throw new UnauthorizedException('Unauthorized');
    } catch (error) {
      console.error('Verification error:', error);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
