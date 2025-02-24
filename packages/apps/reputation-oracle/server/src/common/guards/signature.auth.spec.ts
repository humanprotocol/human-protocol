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
import { AuthSignatureRole } from '../enums/role';

import { SignatureAuthGuard } from './signature.auth';

describe('SignatureAuthGuard', () => {
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
        role: AuthSignatureRole.JobLauncher,
      },
      {
        name: 'exchangeOracle',
        role: AuthSignatureRole.Exchange,
      },
      {
        name: 'recordingOracle',
        role: AuthSignatureRole.Recording,
      },
    ])(
      'should return true if signature is verified for "$role" role',
      async ({ name, role }) => {
        const guard = new SignatureAuthGuard([role]);

        const { privateKey, address } = generateEthWallet();
        EscrowUtils.getEscrow = jest.fn().mockResolvedValueOnce({
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
      const guard = new SignatureAuthGuard([AuthSignatureRole.JobLauncher]);

      EscrowUtils.getEscrow = jest.fn().mockResolvedValueOnce({
        launcher: generateEthWallet().address,
      });

      const signature = await signMessage(body, generateEthWallet().privateKey);

      const request = {
        headers: {
          'human-signature': signature,
        },
        body,
      };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      let catchedError;
      try {
        await guard.canActivate(
          executionContextMock as unknown as ExecutionContext,
        );
      } catch (error) {
        catchedError = error;
      }
      expect(catchedError).toBeInstanceOf(HttpException);
      expect(catchedError).toHaveProperty('message', 'Invalid web3 signature');
      expect(catchedError).toHaveProperty('status', HttpStatus.UNAUTHORIZED);
    });

    it('should throw unauthorized exception for unrecognized oracle type', async () => {
      const guard = new SignatureAuthGuard([]);

      const { privateKey, address } = generateEthWallet();
      EscrowUtils.getEscrow = jest.fn().mockResolvedValueOnce({
        launcher: address,
        exachangeOracle: address,
        recordingOracle: address,
      });

      const signature = await signMessage(body, privateKey);

      const request = {
        headers: {
          'human-signature': signature,
        },
        body,
      };
      executionContextMock.__getRequest.mockReturnValueOnce(request);

      let catchedError;
      try {
        await guard.canActivate(
          executionContextMock as unknown as ExecutionContext,
        );
      } catch (error) {
        catchedError = error;
      }
      expect(catchedError).toBeInstanceOf(HttpException);
      expect(catchedError).toHaveProperty('message', 'Invalid web3 signature');
      expect(catchedError).toHaveProperty('status', HttpStatus.UNAUTHORIZED);
    });
  });
});
