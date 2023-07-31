import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Web3Service } from './web3.service';
import { MOCK_S3_ACCESS_KEY, MOCK_S3_BUCKET, MOCK_S3_ENDPOINT, MOCK_S3_PORT, MOCK_S3_SECRET_KEY, MOCK_S3_USE_SSL, MOCK_WEB3_PRIVATE_KEY } from '../../../test/constants';
import { networkMap } from '../../common/constants/networks';

describe('Web3Service', () => {
  let web3Service: Web3Service;

  beforeAll(async () => {
    const configServiceMock = {
      get: jest.fn().mockReturnValue(MOCK_WEB3_PRIVATE_KEY),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(
          registerAs("web3", () => ({
            web3PrivateKey: MOCK_WEB3_PRIVATE_KEY,
          })),
        ),
      ],
      providers: [
        Web3Service
      ],
    }).compile();

    web3Service = moduleRef.get<Web3Service>(Web3Service);
  });

  describe('getSigner', () => {
    it('should return the signer for the specified chainId', async () => {
      for (const networkKey of Object.keys(networkMap)) {
        // Iterate through the networkMap to test each chainId
        const network = networkMap[networkKey];

        const signer = web3Service.getSigner(network.chainId);
        expect(signer).toBeDefined();
        expect((signer.provider as any).connection.url).toBe(network.rpcUrl);
      }
    });

    it('should return undefined if chainId is not configured', () => {
      const chainId = 1;

      const signer = web3Service.getSigner(chainId);

      expect(signer).toBeUndefined();
    });
  });
});
