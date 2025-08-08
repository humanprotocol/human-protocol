import { EscrowUtils } from '@human-protocol/sdk';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AssignmentRepository } from '../../modules/assignment/assignment.repository';
import { HEADER_SIGNATURE_KEY } from '../constant';
import { ErrorAssignment, ErrorSignature } from '../constant/errors';
import { AuthSignatureRole } from '../enums/role';
import { AuthError, NotFoundError } from '../errors';
import { verifySignature } from '../utils/signature';

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly assignmentRepository: AssignmentRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<AuthSignatureRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!roles) throw new Error(ErrorSignature.MissingRoles);
    const request = context.switchToHttp().getRequest();
    const data = request.body;
    const signature = request.headers[HEADER_SIGNATURE_KEY];
    const oracleAdresses: string[] = [];

    if (roles.includes(AuthSignatureRole.Worker)) {
      const assignment = await this.assignmentRepository.findOneById(
        data.assignment_id,
      );
      if (assignment) {
        oracleAdresses.push(assignment.workerAddress);
      } else {
        throw new NotFoundError(ErrorAssignment.NotFound);
      }
    } else {
      const escrowData = await EscrowUtils.getEscrow(
        data.chain_id,
        data.escrow_address,
      );

      if (roles.includes(AuthSignatureRole.JobLauncher)) {
        oracleAdresses.push(escrowData.launcher);
      }

      if (roles.includes(AuthSignatureRole.Recording)) {
        oracleAdresses.push(escrowData.recordingOracle!);
      }

      if (roles.includes(AuthSignatureRole.Reputation)) {
        oracleAdresses.push(escrowData.reputationOracle!);
      }
    }

    let isVerified = false;
    try {
      isVerified = verifySignature(data, signature, oracleAdresses);
    } catch {
      // noop
    }

    if (!isVerified) {
      throw new AuthError('Unauthorized');
    }

    return true;
  }
}
