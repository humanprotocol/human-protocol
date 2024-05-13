import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MOCK_WEB3_PRIVATE_KEY } from '../../../test/constants';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { Web3Service } from './web3.service';
import { NetworkConfigService } from '../../common/config/network-config.service';

describe('Web3Service', () => {
  let mockConfigService: Partial<ConfigService>;
  let web3Service: Web3Service;
  let networkConfigService: NetworkConfigService;

  jest
    .spyOn(Web3ConfigService.prototype, 'privateKey', 'get')
    .mockReturnValue(MOCK_WEB3_PRIVATE_KEY);

  beforeAll(async () => {
    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        switch (key) {
          case 'RPC_URL_LOCALHOST':
            return 'http://localhost:8545/';
          case 'WEB3_ENV':
            return 'localhost';
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
        Web3ConfigService,
        NetworkConfigService,
      ],
    }).compile();

    web3Service = moduleRef.get<Web3Service>(Web3Service);
    networkConfigService =
      moduleRef.get<NetworkConfigService>(NetworkConfigService);
  });

  describe('getSigner', () => {
    it('should return the signer for the specified chainId', async () => {
      for (const network of networkConfigService.networks) {
        const signer = web3Service.getSigner(network.chainId);
        expect(signer).toBeDefined();
      }
    });

    it('should return undefined if chainId is not configured', () => {
      const chainId = 1;

      const signer = web3Service.getSigner(chainId);

      expect(signer).toBeUndefined();
    });
  });
});
