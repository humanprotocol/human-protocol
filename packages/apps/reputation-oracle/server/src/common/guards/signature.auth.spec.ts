jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowUtils: {
    getEscrow: jest.fn(),
  },
}));

import { EscrowUtils } from '@human-protocol/sdk';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

import {
  generateContractAddress,
  generateEthWallet,
  generateTestnetChainId,
} from '../../../test/fixtures/web3';
import {
  createExecutionContextMock,
  ExecutionContextMock,
} from '../../../test/mock-creators/nest';
import { signMessage } from '../../utils/web3';

import { AuthSignatureRole, SignatureAuthGuard } from './signature.auth';

describe('SignatureAuthGuard', () => {
  it('should throw if empty roles provided in constructor', async () => {
    let thrownError;
    try {
      new SignatureAuthGuard([]);
    } catch (error) {
      thrownError = error;
    }
    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError.message).toBe(
      'At least one auth signature role should be provided',
    );
  });

  describe('canActivate', () => {
    let executionContextMock: ExecutionContextMock;
    let body: {
      chain_id: number;
      escrow_address: string;
    };

    beforeEach(() => {
      executionContextMock = createExecutionContextMock();
      body = {
        chain_id: generateTestnetChainId(),
        escrow_address: generateContractAddress(),
      };
    });

    it.each([
      {
        name: 'launcher',
        role: AuthSignatureRole.JOB_LAUNCHER,
      },
      {
        name: 'exchangeOracle',
        role: AuthSignatureRole.EXCHANGE_ORACLE,
      },
      {
        name: 'recordingOracle',
        role: AuthSignatureRole.RECORDING_ORACLE,
      },
    ])(
      'should return true if signature is verified for "$role" role',
      async ({ name, role }) => {
        const guard = new SignatureAuthGuard([role]);

        const { privateKey, address } = generateEthWallet();

        (EscrowUtils.getEscrow as jest.Mock).mockResolvedValueOnce({
          [name]: address,
        });

        const signature = await signMessage(body, privateKey);

        const request = {
          headers: {
            'human-signature': signature,
          },
          body,
        };
        executionContextMock.__getRequest.mockReturnValueOnce(request);

        const result = await guard.canActivate(
          executionContextMock as unknown as ExecutionContext,
        );

        expect(result).toBeTruthy();
        expect(EscrowUtils.getEscrow).toHaveBeenCalledWith(
          body.chain_id,
          body.escrow_address,
        );
      },
    );

    it('should throw unauthorized exception if signature is not verified', async () => {
      const guard = new SignatureAuthGuard([AuthSignatureRole.JOB_LAUNCHER]);

      const { privateKey, address } = generateEthWallet();
      (EscrowUtils.getEscrow as jest.Mock).mockResolvedValueOnce({
        launcher: address,
      });
      const signature = await signMessage(
        {
          'same-signer': 'different-message',
        },
        privateKey,
      );

      const request = {
        headers: {
          'human-signature': signature,
        },
        body,
      };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      let thrownError;
      try {
        await guard.canActivate(
          executionContextMock as unknown as ExecutionContext,
        );
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(HttpException);
      expect(thrownError.message).toBe('Invalid web3 signature');
      expect(thrownError.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should throw unauthorized exception if not initialized for signer role', async () => {
      const guard = new SignatureAuthGuard([
        AuthSignatureRole.RECORDING_ORACLE,
      ]);

      const { privateKey, address } = generateEthWallet();
      (EscrowUtils.getEscrow as jest.Mock).mockResolvedValueOnce({
        launcher: address,
        exchangeOracle: address,
      });

      const signature = await signMessage(body, privateKey);

      const request = {
        headers: {
          'human-signature': signature,
        },
        body,
      };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      let thrownError;
      try {
        await guard.canActivate(
          executionContextMock as unknown as ExecutionContext,
        );
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(HttpException);
      expect(thrownError.message).toBe('Invalid web3 signature');
      expect(thrownError.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should throw unauthorized exception if escrow lacks oracle addresses', async () => {
      const guard = new SignatureAuthGuard([
        AuthSignatureRole.JOB_LAUNCHER,
        AuthSignatureRole.EXCHANGE_ORACLE,
        AuthSignatureRole.RECORDING_ORACLE,
      ]);

      const { privateKey } = generateEthWallet();
      (EscrowUtils.getEscrow as jest.Mock).mockResolvedValueOnce({
        launcher: '',
        exchangeOracle: '',
        recordingOracle: '',
      });

      const signature = await signMessage(body, privateKey);

      const request = {
        headers: {
          'human-signature': signature,
        },
        body,
      };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      let thrownError;
      try {
        await guard.canActivate(
          executionContextMock as unknown as ExecutionContext,
        );
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(HttpException);
      expect(thrownError.message).toBe('Invalid web3 signature');
      expect(thrownError.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
