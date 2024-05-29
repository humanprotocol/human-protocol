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
  constructor(private readonly role: Role[]) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const data = request.body;
    const signature = request.headers[HEADER_SIGNATURE_KEY];

    console.log('Data:', data);
    console.log('Signature:', signature);
    console.log('Roles:', this.role);

    try {
      // Worker role verification
      if (this.role.includes(Role.Worker)) {
        const isVerified = await verifySignature(data, signature, [
          data.senderAddress,
        ]);
        console.log('Worker verification result:', isVerified);
        if (isVerified) {
          return true;
        }
        console.log('Worker verification failed');
        throw new UnauthorizedException('Unauthorized');
      }

      // Other roles verification
      const escrowData = await EscrowUtils.getEscrow(
        data.chain_id,
        data.escrow_address,
      );
      console.log('Escrow Data:', escrowData);

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

      const isVerified = await verifySignature(
        data,
        signature,
        oracleAddresses,
      );
      console.log('Oracle verification result:', isVerified);

      if (isVerified) {
        return true;
      }
      console.log('Oracle verification failed');
      throw new UnauthorizedException('Unauthorized');
    } catch (error) {
      console.error('Verification error:', error);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
