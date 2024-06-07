import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { SignatureAuthGuard } from './signature.auth';
import { verifySignature } from '../utils/signature';
import { ChainId, EscrowUtils } from '@human-protocol/sdk';
import { MOCK_ADDRESS } from '../../../test/constants';
import { Role } from '../enums/role';
import { ControlledError } from '../errors/controlled';

jest.mock('../../common/utils/signature');

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowUtils: {
    getEscrow: jest.fn().mockResolvedValue({
      launcher: '0x1234567890123456789012345678901234567890',
      exchangeOracle: '0x1234567890123456789012345678901234567891',
      reputationOracle: '0x1234567890123456789012345678901234567892',
    }),
  },
}));

describe('SignatureAuthGuard', () => {
  let guard: SignatureAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SignatureAuthGuard,
          useValue: new SignatureAuthGuard([
            Role.JobLauncher,
            Role.Exchange,
            Role.Recording,
          ]),
        },
      ],
    }).compile();

    guard = module.get<SignatureAuthGuard>(SignatureAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let context: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        switchToHttp: jest.fn().mockReturnThis(),
        getRequest: jest.fn().mockReturnThis(),
        headers: {},
        body: {},
        originalUrl: '',
      };
      context = {
        switchToHttp: jest.fn().mockReturnThis(),
        getRequest: jest.fn(() => mockRequest),
      } as any as ExecutionContext;
    });

    it('should return true if signature is verified', async () => {
      mockRequest.headers['header-signature-key'] = 'validSignature';
      mockRequest.body = {
        escrow_address: MOCK_ADDRESS,
        chain_id: ChainId.LOCALHOST,
      };
      (verifySignature as jest.Mock).mockReturnValue(true);

      const result = await guard.canActivate(context as any);
      expect(result).toBeTruthy();
      expect(EscrowUtils.getEscrow).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        MOCK_ADDRESS,
      );
    });

    it('should throw unauthorized exception if signature is not verified', async () => {
      (verifySignature as jest.Mock).mockReturnValue(false);

      await expect(guard.canActivate(context as any)).rejects.toThrow(
        new ControlledError('Unauthorized', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should throw unauthorized exception for unrecognized oracle type', async () => {
      mockRequest.originalUrl = '/some/random/path';
      await expect(guard.canActivate(context as any)).rejects.toThrow(
        new ControlledError('Unauthorized', HttpStatus.UNAUTHORIZED),
      );
    });
  });
});
