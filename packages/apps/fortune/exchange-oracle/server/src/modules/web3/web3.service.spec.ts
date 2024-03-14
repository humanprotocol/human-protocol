import { ChainId } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MAINNET_CHAIN_IDS, TESTNET_CHAIN_IDS } from '../../common/constant';
import { ErrorWeb3 } from '../../common/constant/errors';
import { Web3Env } from '../../common/enums/web3';
import { Web3Service } from './web3.service';
import { MOCK_PRIVATE_KEY } from './../../../test/constants';

describe('Web3Service', () => {
  let mockConfigService: Partial<ConfigService>;
  let web3Service: Web3Service;

  beforeAll(async () => {
    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        switch (key) {
          case 'WEB3_PRIVATE_KEY':
            return MOCK_PRIVATE_KEY;
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
    it('should return a signer for a valid chainId on TESTNET', () => {
      const validChainId = ChainId.POLYGON_MUMBAI;

      const signer = web3Service.getSigner(validChainId);
      expect(signer).toBeDefined();
    });

    it('should throw invalid chain id provided for the testnet environment', () => {
      const invalidChainId = ChainId.POLYGON;

      expect(() => web3Service.getSigner(invalidChainId)).toThrow(
        ErrorWeb3.InvalidChainId,
      );
    });
  });

  describe('getValidChains', () => {
    it('should get all valid chainIds on MAINNET', () => {
      (web3Service as any).currentWeb3Env = Web3Env.MAINNET;
      const validChainIds = web3Service.getValidChains();
      expect(validChainIds).toBe(MAINNET_CHAIN_IDS);
    });

    it('should get all valid chainIds on TESTNET', () => {
      (web3Service as any).currentWeb3Env = Web3Env.TESTNET;
      const validChainIds = web3Service.getValidChains();
      expect(validChainIds).toBe(TESTNET_CHAIN_IDS);
    });
  });
});
