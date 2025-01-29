import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { SignatureAuthGuard } from './signature.auth';
import { verifySignature } from '../utils/signature';
import { ChainId, EscrowUtils } from '@human-protocol/sdk';
import { MOCK_ADDRESS } from '../../../test/constants';
import { AuthSignatureRole } from '../enums/role';

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
            AuthSignatureRole.JobLauncher,
            AuthSignatureRole.Exchange,
            AuthSignatureRole.Recording,
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
      (verifySignature as jest.Mock).mockReturnValueOnce(false);

      try {
        await guard.canActivate(context as any);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toHaveProperty(
          'message',
          'Invalid web3 signature',
        );
        expect(error.response).toHaveProperty('timestamp');
        expect(error).toHaveProperty('status', HttpStatus.UNAUTHORIZED);
      }
    });

    it('should throw unauthorized exception for unrecognized oracle type', async () => {
      mockRequest.originalUrl = '/some/random/path';
      try {
        await guard.canActivate(context as any);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toHaveProperty(
          'message',
          'Invalid web3 signature',
        );
        expect(error.response).toHaveProperty('timestamp');
        expect(error).toHaveProperty('status', HttpStatus.UNAUTHORIZED);
      }
    });
  });
});
