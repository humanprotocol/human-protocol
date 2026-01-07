import { faker } from '@faker-js/faker';
import { ChainId, EscrowUtils } from '@human-protocol/sdk';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AssignmentRepository } from '../../modules/assignment/assignment.repository';
import { HEADER_SIGNATURE_KEY } from '../constant';
import { AuthSignatureRole } from '../enums/role';
import { AuthError, ValidationError } from '../errors';
import { verifySignature } from '../utils/signature';
import { SignatureAuthGuard } from './signature.auth';
import { ErrorAssignment, ErrorEscrow } from '../constant/errors';

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

    (EscrowUtils.getEscrow as jest.Mock).mockClear();
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
      const mockEscrowAddress = faker.finance.ethereumAddress();
      mockRequest.body = {
        escrow_address: mockEscrowAddress,
        chain_id: ChainId.LOCALHOST,
      };
      (verifySignature as jest.Mock).mockReturnValue(true);

      const result = await guard.canActivate(context);
      expect(result).toBeTruthy();
      expect(EscrowUtils.getEscrow).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        mockEscrowAddress,
      );
    });

    it('should throw AuthError if signature is not verified', async () => {
      reflector.get = jest
        .fn()
        .mockReturnValue([AuthSignatureRole.JobLauncher]);

      mockRequest.headers[HEADER_SIGNATURE_KEY] = 'invalidSignature';
      mockRequest.body = {
        escrow_address: faker.finance.ethereumAddress(),
        chain_id: ChainId.LOCALHOST,
      };
      (verifySignature as jest.Mock).mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(AuthError);
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

    it('should throw AuthError if assignment is not found for Worker role', async () => {
      reflector.get = jest.fn().mockReturnValue([AuthSignatureRole.Worker]);

      mockRequest.headers[HEADER_SIGNATURE_KEY] = 'validSignature';
      mockRequest.body = {
        assignment_id: '1',
      };
      (verifySignature as jest.Mock).mockReturnValue(true);
      assignmentRepository.findOneById.mockResolvedValue(null);

      const resultPromise = guard.canActivate(context);
      await expect(resultPromise).rejects.toBeInstanceOf(ValidationError);
      await expect(resultPromise).rejects.toThrow(ErrorAssignment.NotFound);
    });

    it('should handle multiple roles and verify signature', async () => {
      reflector.get = jest
        .fn()
        .mockReturnValue([
          AuthSignatureRole.JobLauncher,
          AuthSignatureRole.Recording,
        ]);

      mockRequest.headers[HEADER_SIGNATURE_KEY] = 'validSignature';
      const mockEscrowAddress = faker.finance.ethereumAddress();
      mockRequest.body = {
        escrow_address: mockEscrowAddress,
        chain_id: ChainId.LOCALHOST,
        assignment_id: '1',
      };
      (verifySignature as jest.Mock).mockReturnValue(true);

      const result = await guard.canActivate(context);
      expect(result).toBeTruthy();
      expect(EscrowUtils.getEscrow).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        mockEscrowAddress,
      );
      expect(verifySignature).toHaveBeenLastCalledWith(
        mockRequest.body,
        mockRequest.headers[HEADER_SIGNATURE_KEY],
        [expect.any(String), expect.any(String)],
      );
    });

    it('should throw ValidationError when escrow data is missing', async () => {
      reflector.get = jest
        .fn()
        .mockReturnValue([AuthSignatureRole.JobLauncher]);

      (EscrowUtils.getEscrow as jest.Mock).mockResolvedValueOnce(null);

      mockRequest.headers[HEADER_SIGNATURE_KEY] = 'validSignature';
      mockRequest.body = {
        escrow_address: faker.finance.ethereumAddress(),
        chain_id: ChainId.LOCALHOST,
      };

      const resultPromise = guard.canActivate(context);
      await expect(resultPromise).rejects.toBeInstanceOf(ValidationError);
      await expect(resultPromise).rejects.toThrow(ErrorEscrow.NotFound);
    });
  });
});
