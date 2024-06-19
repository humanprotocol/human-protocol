import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { verifySignature } from '../utils/signature';
import { HEADER_SIGNATURE_KEY } from '../constant';
import { EscrowUtils } from '@human-protocol/sdk';
import { Role } from '../enums/role';
import { Reflector } from '@nestjs/core';
import { AssignmentRepository } from '../../modules/assignment/assignment.repository';
import { ErrorAssignment, ErrorSignature } from '../constant/errors';

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly assignmentRepository: AssignmentRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!roles) throw new NotImplementedException(ErrorSignature.MissingRoles);
    const request = context.switchToHttp().getRequest();
    const data = request.body;
    const signature = request.headers[HEADER_SIGNATURE_KEY];
    const oracleAdresses: string[] = [];

    if (roles.includes(Role.Worker)) {
      const assignment = await this.assignmentRepository.findOneById(
        data.assignment_id,
      );
      if (assignment) {
        oracleAdresses.push(assignment.workerAddress);
      } else {
        throw new UnauthorizedException(ErrorAssignment.NotFound);
      }
    } else {
      const escrowData = await EscrowUtils.getEscrow(
        data.chain_id,
        data.escrow_address,
      );

      if (roles.includes(Role.JobLauncher)) {
        oracleAdresses.push(escrowData.launcher);
      }

      if (roles.includes(Role.Recording)) {
        oracleAdresses.push(escrowData.recordingOracle!);
      }

      if (roles.includes(Role.Reputation)) {
        oracleAdresses.push(escrowData.reputationOracle!);
      }
    }
    try {
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
