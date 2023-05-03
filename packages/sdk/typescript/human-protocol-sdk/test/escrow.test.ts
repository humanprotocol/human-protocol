/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signer, ethers } from 'ethers';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import EscrowClient from '../src/escrow';
import { InitClient } from '../src/init';
import { NetworkData } from '../src/types';

// vi.mock('../src/init');

describe('EscrowClient', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: Signer;
  let network: NetworkData | undefined;
  let escrowClient: any;
  let mockEscrowContract: any;
  let mockGetClientParams: any;

  beforeAll(async () => {
    provider = new ethers.providers.JsonRpcProvider();
    signer = provider.getSigner();
    network = NETWORKS[ChainId.LOCALHOST];
    // mockGetClientParams = InitClient.getParams as jest.Mock;
  });

  beforeEach(async () => {
    // mockGetClientParams.mockResolvedValue({
    //   signerOrProvider: signer,
    //   network,
    // });
    escrowClient = new EscrowClient(await InitClient.getParams(signer));
    // mockEscrowContract = {
    //   ...escrowClient.contract,
    //   set: vi.fn(),
    //   setBulk: vi.fn(),
    //   get: vi.fn(),
    //   address: network?.kvstoreAddress,
    // };
    // escrowClient.contract = mockEscrowContract;
  });

  describe('Create Escrow', () => {
    test('should not create an escrow without staking', async () => {
      expect(
        escrowClient.createEscrow(network?.hmtAddress, [
          await signer.getAddress(),
        ])
      ).rejects.toThrow(
        Error(
          'Failed to create escrow: Needs to stake HMT tokens to create an escrow.'
        )
      );
    });
  });
});
