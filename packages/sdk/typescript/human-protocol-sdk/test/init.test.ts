import { describe, test, expect, vi } from 'vitest';
import {
  ErrorInitProviderDoesNotExist,
  ErrorInitUnsupportedChainID,
} from '../src/error';
import { FAKE_NETWORK_NAME, FAKE_NETWORK } from './utils/constants';

import { ethers } from 'ethers';
import InitClient from '../src/init';
import { IClientParams } from '../src/interfaces';
import { ChainId } from '../src/enums';

// Mock Signer and Provider
const mockProvider = new ethers.providers.JsonRpcProvider();
const mockSigner = mockProvider.getSigner();

describe('InitClient', () => {
  describe('getParams', () => {
    test('should throw an error if Signer provider does not exist', async () => {
      const invalidSigner = ethers.Wallet.createRandom();
      const result = await InitClient.getParams(invalidSigner);
      expect(() => result).toThrow(ErrorInitProviderDoesNotExist);
    });

    test('should throw an error if chainId is not supported', async () => {
      const invalidProvider = new ethers.providers.JsonRpcProvider();
      const invalidNetwork = { name: FAKE_NETWORK_NAME, chainId: ChainId.ALL };
      const invalidSigner = invalidProvider.getSigner();

      vi.spyOn(invalidProvider, 'getNetwork').mockImplementation(
        async () => invalidNetwork
      );

      vi.spyOn(InitClient, 'getParams').mockImplementation(() => {
        throw ErrorInitUnsupportedChainID;
      });

      const result = await InitClient.getParams(invalidSigner);

      expect(() => result).toThrow(ErrorInitUnsupportedChainID);
    });

    test('should return the client parameters for a Signer', async () => {
      const expectedClientParams: IClientParams = {
        signerOrProvider: mockSigner,
        network: FAKE_NETWORK,
      };

      vi.spyOn(InitClient, 'getParams').mockImplementation(() =>
        Promise.resolve(expectedClientParams)
      );

      const clientParams = await InitClient.getParams(mockSigner);

      expect(clientParams).toEqual(expectedClientParams);
    });

    test('should return the client parameters for a Provider', async () => {
      const expectedClientParams: IClientParams = {
        signerOrProvider: mockProvider,
        network: FAKE_NETWORK,
      };

      vi.spyOn(InitClient, 'getParams').mockImplementation(() =>
        Promise.resolve(expectedClientParams)
      );

      const clientParams = await InitClient.getParams(mockProvider);

      expect(clientParams).toEqual(expectedClientParams);
    });
  });
});
