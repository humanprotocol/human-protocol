import { ChainId } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MAINNET_CHAIN_IDS, TESTNET_CHAIN_IDS } from '../../common/constants';
import { ErrorWeb3 } from '../../common/constants/errors';
import { Web3Env } from '../../common/enums/web3';
import { Web3Service } from './web3.service';
import { MOCK_ADDRESS, MOCK_PRIVATE_KEY } from './../../../test/constants';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';

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
            return Web3Env.TESTNET;
          case 'RPC_URL_POLYGON_AMOY':
            return 'http://0.0.0.0:8545';
          default:
            return defaultValue;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        Web3Service,
        Web3ConfigService,
        NetworkConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    web3Service = moduleRef.get<Web3Service>(Web3Service);
  });

  describe('constructor', () => {
    it('should throw an error if no valid networks are found', () => {
      mockConfigService.get = jest
        .fn()
        .mockImplementationOnce((key: string, defaultValue?: any) => {
          switch (key) {
            case 'WEB3_PRIVATE_KEY':
              return MOCK_PRIVATE_KEY;
            case 'WEB3_ENV':
              return Web3Env.MAINNET;
            case 'RPC_URL_POLYGON_AMOY':
              return 'http://0.0.0.0:8545';
            default:
              return defaultValue;
          }
        });
      expect(
        () =>
          new Web3Service(
            new Web3ConfigService(mockConfigService as ConfigService),
            new NetworkConfigService(mockConfigService as ConfigService),
          ),
      ).toThrow(ErrorWeb3.NoValidNetworks);
    });
  });

  describe('getSigner', () => {
    it('should return a signer for a valid chainId on TESTNET', () => {
      mockConfigService.get = jest.fn().mockReturnValue(Web3Env.TESTNET);
      const validChainId = ChainId.POLYGON_AMOY;

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

  describe('getOperatorAddress', () => {
    it('should get the operator address', () => {
      const operatorAddress = web3Service.getOperatorAddress();
      expect(operatorAddress).toBe(MOCK_ADDRESS);
    });
  });
});
