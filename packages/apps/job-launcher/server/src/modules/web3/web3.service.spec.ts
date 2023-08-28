import { ChainId } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MAINNET_CHAIN_IDS, TESTNET_CHAIN_IDS } from '../../common/constants';
import { ErrorWeb3 } from '../../common/constants/errors';
import { Web3Env } from '../../common/enums/web3';
import { Web3Service } from './web3.service';

describe('Web3Service', () => {
  let mockConfigService: Partial<ConfigService>;
  let web3Service: Web3Service;
  const privateKey =
    '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

  beforeAll(async () => {
    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        switch (key) {
          case 'WEB3_PRIVATE_KEY':
            return privateKey;
          case 'WEB3_ENV':
            return 'testnet';
          default:
            return defaultValue;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        Web3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    web3Service = moduleRef.get<Web3Service>(Web3Service);
  });

  describe('getSigner', () => {
    it('should return a signer for a valid chainId on MAINNET', () => {
      mockConfigService.get = jest.fn().mockReturnValue(Web3Env.MAINNET);

      const validChainId = ChainId.POLYGON;

      const signer = web3Service.getSigner(validChainId);
      expect(signer).toBeDefined();
    });

    it('should throw invalid chain id provided for the mainnet environment', () => {
      mockConfigService.get = jest.fn().mockReturnValue(Web3Env.MAINNET);
      const invalidChainId = ChainId.LOCALHOST;

      expect(() => web3Service.getSigner(invalidChainId)).toThrow(
        ErrorWeb3.InvalidMainnetChainId,
      );
    });

    it('should return a signer for a valid chainId on TESTNET', () => {
      mockConfigService.get = jest.fn().mockReturnValue(Web3Env.TESTNET);

      const validChainId = ChainId.POLYGON_MUMBAI;

      const signer = web3Service.getSigner(validChainId);
      expect(signer).toBeDefined();
    });

    it('should throw invalid chain id provided for the testnet environment', () => {
      mockConfigService.get = jest.fn().mockReturnValue(Web3Env.TESTNET);
      const invalidChainId = ChainId.POLYGON;

      expect(() => web3Service.getSigner(invalidChainId)).toThrow(
        ErrorWeb3.InvalidTestnetChainId,
      );
    });
  });

  describe('getValidChains', () => {
    it('should get all valid chainIds on MAINNET', () => {
      mockConfigService.get = jest.fn().mockReturnValue(Web3Env.MAINNET);
      const validChainIds = web3Service.getValidChains();
      expect(validChainIds).toBe(MAINNET_CHAIN_IDS);
    });

    it('should get all valid chainIds on TESTNET', () => {
      mockConfigService.get = jest.fn().mockReturnValue(Web3Env.TESTNET);
      const validChainIds = web3Service.getValidChains();
      expect(validChainIds).toBe(TESTNET_CHAIN_IDS);
    });
  });
});
