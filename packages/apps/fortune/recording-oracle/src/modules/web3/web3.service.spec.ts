import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MOCK_WEB3_PRIVATE_KEY } from '../../../test/constants';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { networkMap } from '../../common/constants/networks';
import { Web3Service } from './web3.service';

describe('Web3Service', () => {
  let web3Service: Web3Service;

  jest
    .spyOn(Web3ConfigService.prototype, 'privateKey', 'get')
    .mockReturnValue(MOCK_WEB3_PRIVATE_KEY);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [Web3Service, ConfigService, Web3ConfigService],
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
      }
    });

    it('should return undefined if chainId is not configured', () => {
      const chainId = 1;

      const signer = web3Service.getSigner(chainId);

      expect(signer).toBeUndefined();
    });
  });
});
