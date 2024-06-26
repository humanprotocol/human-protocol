import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SignatureAuthGuard } from './signature.auth';
import { verifySignature } from '../utils/signature';
import { ChainId, EscrowUtils } from '@human-protocol/sdk';
import { AuthSignatureRole } from '../enums/role';
import { HEADER_SIGNATURE_KEY } from '../constant';
import { AssignmentRepository } from '../../modules/assignment/assignment.repository';
import { Reflector } from '@nestjs/core';

jest.mock('../utils/signature');
jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowUtils: {
    getEscrow: jest.fn().mockResolvedValue({
      launcher: '0x1234567890123456789012345678901234567891',
      recordingOracle: '0x1234567890123456789012345678901234567892',
    }),
  },
}));

describe('SignatureAuthGuard', () => {
  let guard: SignatureAuthGuard;
  let reflector: Reflector;
  let assignmentRepository: jest.Mocked<AssignmentRepository>;

  beforeEach(async () => {
    assignmentRepository = {
      findOneById: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignatureAuthGuard,
        Reflector,
        {
          provide: AssignmentRepository,
          useValue: assignmentRepository,
        },
      ],
    }).compile();

    guard = module.get<SignatureAuthGuard>(SignatureAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let context: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {},
        body: {},
      };
      context = {
        switchToHttp: jest.fn().mockReturnThis(),
        getRequest: jest.fn(() => mockRequest),
        getHandler: jest.fn().mockReturnValue(() => {}),
      } as any as ExecutionContext;
    });

    it('should return true if signature is verified for JobLauncher role', async () => {
      reflector.get = jest
        .fn()
        .mockReturnValue([AuthSignatureRole.JobLauncher]);

      mockRequest.headers[HEADER_SIGNATURE_KEY] = 'validSignature';
      mockRequest.body = {
        escrow_address: '0x123',
        chain_id: ChainId.LOCALHOST,
      };
      (verifySignature as jest.Mock).mockReturnValue(true);

      const result = await guard.canActivate(context);
      expect(result).toBeTruthy();
      expect(EscrowUtils.getEscrow).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        '0x123',
      );
    });

    it('should throw UnauthorizedException if signature is not verified', async () => {
      reflector.get = jest
        .fn()
        .mockReturnValue([AuthSignatureRole.JobLauncher]);

      mockRequest.headers[HEADER_SIGNATURE_KEY] = 'invalidSignature';
      mockRequest.body = {
        escrow_address: '0x123',
        chain_id: ChainId.LOCALHOST,
      };
      (verifySignature as jest.Mock).mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle Worker role and verify signature', async () => {
      reflector.get = jest.fn().mockReturnValue([AuthSignatureRole.Worker]);

      mockRequest.headers[HEADER_SIGNATURE_KEY] = 'validSignature';
      mockRequest.body = {
        assignment_id: '1',
      };
      (verifySignature as jest.Mock).mockReturnValue(true);
      assignmentRepository.findOneById.mockResolvedValue({
        workerAddress: '0xworkerAddress',
      } as any);

      const result = await guard.canActivate(context);
      expect(result).toBeTruthy();
      expect(assignmentRepository.findOneById).toHaveBeenCalledWith('1');
    });

    it('should throw UnauthorizedException if assignment is not found for Worker role', async () => {
      reflector.get = jest.fn().mockReturnValue([AuthSignatureRole.Worker]);

      mockRequest.headers[HEADER_SIGNATURE_KEY] = 'validSignature';
      mockRequest.body = {
        assignment_id: '1',
      };
      (verifySignature as jest.Mock).mockReturnValue(true);
      assignmentRepository.findOneById.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle multiple roles and verify signature', async () => {
      reflector.get = jest
        .fn()
        .mockReturnValue([
          AuthSignatureRole.JobLauncher,
          AuthSignatureRole.Worker,
        ]);

      mockRequest.headers[HEADER_SIGNATURE_KEY] = 'validSignature';
      mockRequest.body = {
        escrow_address: '0x123',
        chain_id: ChainId.LOCALHOST,
        assignment_id: '1',
      };
      (verifySignature as jest.Mock).mockReturnValue(true);
      assignmentRepository.findOneById.mockResolvedValue({
        workerAddress: '0xworkerAddress',
      } as any);

      const result = await guard.canActivate(context);
      expect(result).toBeTruthy();
      expect(EscrowUtils.getEscrow).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        '0x123',
      );
      expect(assignmentRepository.findOneById).toHaveBeenCalledWith('1');
    });
  });
});
