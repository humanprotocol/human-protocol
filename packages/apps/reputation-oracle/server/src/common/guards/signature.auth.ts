import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { verifySignature } from '../../utils/web3';
import { HEADER_SIGNATURE_KEY } from '../constants';
import { EscrowUtils } from '@human-protocol/sdk';
import { AuthSignatureRole } from '../enums/role';

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor(private role: AuthSignatureRole[]) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const data = request.body;
    const signature = request.headers[HEADER_SIGNATURE_KEY];
    const oracleAdresses: string[] = [];
    const escrowData = await EscrowUtils.getEscrow(
      data.chain_id,
      data.escrow_address,
    );
    if (
      this.role.includes(AuthSignatureRole.JobLauncher) &&
      escrowData.launcher.length
    )
      oracleAdresses.push(escrowData.launcher);
    if (
      this.role.includes(AuthSignatureRole.Exchange) &&
      escrowData.exchangeOracle?.length
    )
      oracleAdresses.push(escrowData.exchangeOracle);
    if (
      this.role.includes(AuthSignatureRole.Recording) &&
      escrowData.recordingOracle?.length
    )
      oracleAdresses.push(escrowData.recordingOracle);

    const isVerified = verifySignature(data, signature, oracleAdresses);

    if (!isVerified) {
      throw new HttpException(
        'Invalid web3 signature',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return true;
  }
}
