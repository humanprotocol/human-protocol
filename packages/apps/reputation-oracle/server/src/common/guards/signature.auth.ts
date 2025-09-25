import { EscrowUtils } from '@human-protocol/sdk';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { HEADER_SIGNATURE_KEY } from '@/common/constants';
import { verifySignature } from '@/utils/web3';

export enum AuthSignatureRole {
  JOB_LAUNCHER = 'job_launcher',
  EXCHANGE_ORACLE = 'exchange',
  RECORDING_ORACLE = 'recording',
}

type SignedRequestData = {
  chain_id?: number;
  escrow_address?: string;
  [x: string]: unknown;
};

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  private readonly authorizedSignerRoles: AuthSignatureRole[];

  constructor(roles: AuthSignatureRole[]) {
    if (roles.length === 0) {
      throw new Error('At least one auth signature role should be provided');
    }

    this.authorizedSignerRoles = roles;
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const data = request.body as SignedRequestData;
    if (!data.chain_id || !data.escrow_address) {
      throw new HttpException('Invalid payload', HttpStatus.BAD_REQUEST);
    }

    const signature: string | undefined = request.headers[HEADER_SIGNATURE_KEY];
    if (!signature) {
      throw new HttpException('Missing signature', HttpStatus.BAD_REQUEST);
    }

    const oracleAdresses: string[] = [];
    const escrowData = await EscrowUtils.getEscrow(
      data.chain_id,
      data.escrow_address,
    );
    if (!escrowData) {
      throw new HttpException('Escrow not found', HttpStatus.BAD_REQUEST);
    }

    if (
      this.authorizedSignerRoles.includes(AuthSignatureRole.JOB_LAUNCHER) &&
      escrowData?.launcher?.length
    ) {
      oracleAdresses.push(escrowData.launcher);
    }
    if (
      this.authorizedSignerRoles.includes(AuthSignatureRole.EXCHANGE_ORACLE) &&
      escrowData?.exchangeOracle?.length
    ) {
      oracleAdresses.push(escrowData.exchangeOracle);
    }
    if (
      this.authorizedSignerRoles.includes(AuthSignatureRole.RECORDING_ORACLE) &&
      escrowData?.recordingOracle?.length
    ) {
      oracleAdresses.push(escrowData.recordingOracle);
    }

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
