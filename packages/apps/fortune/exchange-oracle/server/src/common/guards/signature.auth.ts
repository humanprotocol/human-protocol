import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifySignature } from '../utils/signature';
import { HEADER_SIGNATURE_KEY } from '../constant';
import { EscrowUtils } from '@human-protocol/sdk';

export enum Role {
  JobLaucher = 'job_launcher',
  Recording = 'recording',
}

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor(private role: Role) {}

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
      if (this.role === Role.JobLaucher)
        oracleAdresses.push(escrowData.launcher);
      if (this.role === Role.Recording)
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
