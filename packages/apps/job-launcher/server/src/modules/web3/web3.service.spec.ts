import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { networkMap } from '../../common/config';
import { Web3Service } from './web3.service';
import { ChainId } from '@human-protocol/sdk';
import { ErrorWeb3 } from '../../common/constants/errors';
import { Web3Env } from '../../common/enums/web3';

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
    /*it.skip('should return the signer for the specified chainId', async () => {
      for (const networkKey of Object.keys(networkMap)) {
        // Iterate through the networkMap to test each chainId
        const network = networkMap[networkKey];

        const signer = web3Service.getSigner(network.chainId);
        expect(signer).toBeDefined();
        expect((signer.provider as any).connection.url).toBe(network.rpcUrl);
      }
    });*/


    /*it('should throw invalid chain id provided for the mainnet environment', async () => {
      const chainId = ChainId.LOCALHOST;

      mockConfigService.get = jest.fn()
                                .mockReturnValueOnce(privateKey)
                                .mockReturnValue(Web3Env.MAINNET);

      expect(
        web3Service.getSigner(chainId)
      ).toThrowError(ErrorWeb3.InvalidMainnetChainId);
    });*/

    it('should return a signer for a valid chainId on MAINNET', () => {
      mockConfigService.get = jest.fn().mockReturnValue(Web3Env.MAINNET);

      const validChainId = ChainId.POLYGON;

      const signer = web3Service.getSigner(validChainId);
      expect(signer).toBeDefined();
    });

    it('should throw invalid chain id provided for the mainnet environment', () => {
      mockConfigService.get = jest.fn().mockReturnValue(Web3Env.MAINNET);
      const invalidChainId = ChainId.LOCALHOST;

      expect(() => web3Service.getSigner(invalidChainId)).toThrow(ErrorWeb3.InvalidMainnetChainId);
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

      expect(() => web3Service.getSigner(invalidChainId)).toThrow(ErrorWeb3.InvalidTestnetChainId);
    });
  });
});
