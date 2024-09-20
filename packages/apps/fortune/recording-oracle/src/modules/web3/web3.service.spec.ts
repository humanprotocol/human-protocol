import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MOCK_WEB3_PRIVATE_KEY, mockConfig } from '../../../test/constants';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { Web3Service } from './web3.service';
import { NetworkConfigService } from '../../common/config/network-config.service';

describe('Web3Service', () => {
  let web3Service: Web3Service;
  let networkConfigService: NetworkConfigService;

  jest
    .spyOn(Web3ConfigService.prototype, 'privateKey', 'get')
    .mockReturnValue(MOCK_WEB3_PRIVATE_KEY);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              return mockConfig[key];
            }),
          },
        },
        Web3Service,
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
