import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { networkMap } from '../../common/config';
import { Web3Service } from './web3.service';

describe('Web3Service', () => {
  let web3Service: Web3Service;
  const privateKey =
    '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

  beforeAll(async () => {
    const configServiceMock = {
      get: jest.fn().mockReturnValue(privateKey),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        Web3Service,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
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
