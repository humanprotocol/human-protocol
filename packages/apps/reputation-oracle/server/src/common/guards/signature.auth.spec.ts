import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { SignatureAuthGuard } from './signature.auth';
import { signMessage } from '../utils/signature';
import { ChainId, EscrowUtils } from '@human-protocol/sdk';
import { MOCK_ADDRESS, MOCK_PRIVATE_KEY } from '../../../test/constants';
import { AuthSignatureRole } from '../enums/role';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowUtils: {
    getEscrow: jest.fn(),
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
    EscrowUtils.getEscrow = jest.fn().mockResolvedValueOnce({
      launcher: MOCK_ADDRESS,
      exchangeOracle: MOCK_ADDRESS,
      reputationOracle: MOCK_ADDRESS,
    });
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
      const body = {
        escrow_address: MOCK_ADDRESS,
        chain_id: ChainId.LOCALHOST,
      };
      const signature = await signMessage(body, MOCK_PRIVATE_KEY);
      mockRequest.headers['human-signature'] = signature;
      mockRequest.body = body;
      const result = await guard.canActivate(context as any);
      expect(result).toBeTruthy();
      expect(EscrowUtils.getEscrow).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        MOCK_ADDRESS,
      );
    });

    it('should throw unauthorized exception if signature is not verified', async () => {
      let catchedError;
      try {
        await guard.canActivate(context as any);
      } catch (error) {
        catchedError = error;
      }
      expect(catchedError).toBeInstanceOf(HttpException);
      expect(catchedError.response).toHaveProperty(
        'message',
        'Invalid web3 signature',
      );
      expect(catchedError.response).toHaveProperty('timestamp');
      expect(catchedError).toHaveProperty('status', HttpStatus.UNAUTHORIZED);
    });

    it('should throw unauthorized exception for unrecognized oracle type', async () => {
      mockRequest.originalUrl = '/some/random/path';
      let catchedError;
      try {
        await guard.canActivate(context as any);
      } catch (error) {
        catchedError = error;
      }
      expect(catchedError).toBeInstanceOf(HttpException);
      expect(catchedError.response).toHaveProperty(
        'message',
        'Invalid web3 signature',
      );
      expect(catchedError.response).toHaveProperty('timestamp');
      expect(catchedError).toHaveProperty('status', HttpStatus.UNAUTHORIZED);
    });
  });
});
