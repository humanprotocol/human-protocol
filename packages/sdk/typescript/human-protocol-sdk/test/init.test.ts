import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ErrorInitProviderDoesNotExist,
  ErrorInitUnsupportedChainID,
} from '../src/error';
import { FAKE_NETWORK_NAME, FAKE_NETWORK } from './utils/constants';

import { ethers } from 'ethers';
import InitClient from '../src/init';
import { IClientParams } from '../src/interfaces';
import { ChainId } from '../src/enums';

describe('InitClient', () => {
  const provider = new ethers.providers.JsonRpcProvider();
  let mockProvider: any;
  let mockSigner: any;

  beforeEach(async () => {
    mockSigner = {
      ...provider.getSigner(),
      getNetwork: vi.fn().mockReturnValue({
        name: FAKE_NETWORK_NAME,
        chainId: ChainId.POLYGON_MUMBAI,
      }),
      getAddress: vi.fn().mockReturnValue(ethers.constants.AddressZero),
    };

    mockProvider = {
      getNetwork: vi.fn().mockReturnValue({
        name: FAKE_NETWORK_NAME,
        chainId: ChainId.POLYGON_MUMBAI,
      }),
      getAddress: vi.fn().mockReturnValue(ethers.constants.AddressZero),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getParams', () => {
    test('should throw an error if Signer provider does not exist', async () => {
      const invalidSigner = ethers.Wallet.createRandom();
      await expect(InitClient.getParams(invalidSigner)).rejects.toThrow(
        ErrorInitProviderDoesNotExist
      );
    });

    test('should throw an error if chainId is not supported', async () => {
      const invalidNetwork = { name: FAKE_NETWORK_NAME, chainId: ChainId.ALL };
      mockProvider.getNetwork.mockResolvedValueOnce(invalidNetwork);

      await expect(InitClient.getParams(mockProvider)).rejects.toThrow(
        ErrorInitUnsupportedChainID
      );
    });

    test('should return the client parameters for a Signer', async () => {
      const expectedClientParams: IClientParams = {
        signerOrProvider: mockSigner,
        network: FAKE_NETWORK,
      };

      InitClient.getParams = vi
        .fn()
        .mockImplementation(() => Promise.resolve(expectedClientParams));

      const clientParams = await InitClient.getParams(mockSigner);

      expect(clientParams).toEqual(expectedClientParams);
    });

    test('should return the client parameters for a Provider', async () => {
      const expectedClientParams: IClientParams = {
        signerOrProvider: mockProvider,
        network: FAKE_NETWORK,
      };

      InitClient.getParams = vi
        .fn()
        .mockImplementation(() => Promise.resolve(expectedClientParams));

      const clientParams = await InitClient.getParams(mockProvider);

      expect(clientParams).toEqual(expectedClientParams);
    });
  });
});
