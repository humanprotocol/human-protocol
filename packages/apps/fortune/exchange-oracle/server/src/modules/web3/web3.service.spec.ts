import { ChainId } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MAINNET_CHAIN_IDS, TESTNET_CHAIN_IDS } from '../../common/constant';
import { ErrorWeb3 } from '../../common/constant/errors';
import { Web3Env } from '../../common/enums/web3';
import { Web3Service } from './web3.service';
import { MOCK_PRIVATE_KEY } from './../../../test/constants';
import { Web3ConfigService } from '../../common/config/web3-config.service';

describe('Web3Service', () => {
  let web3Service: Web3Service;
  let web3ConfigService: Web3ConfigService;

  jest
    .spyOn(Web3ConfigService.prototype, 'privateKey', 'get')
    .mockReturnValue(MOCK_PRIVATE_KEY);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [Web3Service, ConfigService, Web3ConfigService],
    }).compile();

    web3Service = moduleRef.get<Web3Service>(Web3Service);
    web3ConfigService = moduleRef.get<Web3ConfigService>(Web3ConfigService);
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
      jest
        .spyOn(web3ConfigService, 'env', 'get')
        .mockReturnValue(Web3Env.MAINNET);
      const validChainIds = web3Service.getValidChains();
      expect(validChainIds).toBe(MAINNET_CHAIN_IDS);
    });

    it('should get all valid chainIds on TESTNET', () => {
      jest
        .spyOn(web3ConfigService, 'env', 'get')
        .mockReturnValue(Web3Env.TESTNET);
      const validChainIds = web3Service.getValidChains();
      expect(validChainIds).toBe(TESTNET_CHAIN_IDS);
    });
  });
});
