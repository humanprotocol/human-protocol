import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FeeData, JsonRpcProvider, Provider } from 'ethers';

import { Web3ConfigService } from '@/config';

import { generateTestnetChainId, mockWeb3ConfigService } from './fixtures';
import type { WalletWithProvider } from './types';
import { Web3Service } from './web3.service';

describe('Web3Service', () => {
  let web3Service: Web3Service;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
        Web3Service,
      ],
    }).compile();

    web3Service = moduleRef.get<Web3Service>(Web3Service);
  });

  it('should succesfully create service instance', () => {
    /**
     * Constructor throws if configuration is invalid,
     * so check for an instance as litmus test
     */
    expect(web3Service).toBeDefined();
  });

  describe('getSigner', () => {
    it('should return correct signer for a valid chainId on testnet', () => {
      const validChainId = generateTestnetChainId();

      const signer = web3Service.getSigner(validChainId);
      expect(signer).toBeDefined();
      expect(signer.address).toEqual(mockWeb3ConfigService.operatorAddress);
      expect(signer.privateKey).toEqual(mockWeb3ConfigService.privateKey);
      expect(signer.provider).toBeInstanceOf(JsonRpcProvider);
    });

    it('should throw if invalid chain id provided', () => {
      const invalidChainId = -42;

      expect(() => web3Service.getSigner(invalidChainId)).toThrow(
        `No signer for provided chain id: ${invalidChainId}`,
      );
    });
  });

  describe('calculateGasPrice', () => {
    const mockProvider = createMock<Provider>();
    let spyOnGetSigner: jest.SpyInstance;

    beforeAll(() => {
      spyOnGetSigner = jest.spyOn(web3Service, 'getSigner').mockImplementation(
        () =>
          ({
            provider: mockProvider,
          }) as unknown as WalletWithProvider,
      );
    });

    afterAll(() => {
      spyOnGetSigner.mockRestore();
    });

    afterEach(() => {
      mockProvider.getFeeData.mockReset();
    });

    it('should use multiplier for gas price', async () => {
      const testChainId = generateTestnetChainId();

      const randomGasPrice = faker.number.bigInt({ min: 1n });

      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: randomGasPrice,
      } as FeeData);

      const gasPrice = await web3Service.calculateGasPrice(testChainId);

      const expectedGasPrice =
        randomGasPrice * BigInt(mockWeb3ConfigService.gasPriceMultiplier);
      expect(gasPrice).toEqual(expectedGasPrice);
    });

    it('should throw if no gas price from provider', async () => {
      const testChainId = generateTestnetChainId();

      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: null,
      } as FeeData);

      await expect(web3Service.calculateGasPrice(testChainId)).rejects.toThrow(
        `No gas price data for chain id: ${testChainId}`,
      );
    });
  });
});
