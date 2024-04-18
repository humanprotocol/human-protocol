import { ChainId } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MOCK_ADDRESS, MOCK_PRIVATE_KEY } from '../../../test/constants';
import { TESTNET_CHAIN_IDS } from '../../common/config';
import { ErrorWeb3 } from '../../common/constants/errors';
import { SignatureType } from '../../common/enums/web3';
import { SignatureBodyDto } from './web3.dto';
import { Web3Service } from './web3.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';

describe('Web3Service', () => {
  let web3Service: Web3Service;

  jest
    .spyOn(Web3ConfigService.prototype, 'privateKey', 'get')
    .mockReturnValue(MOCK_PRIVATE_KEY);

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [Web3Service, ConfigService, Web3ConfigService],
    }).compile();

    web3Service = moduleRef.get<Web3Service>(Web3Service);
  });

  describe('getSigner', () => {
    it('should return a signer for a valid chainId on TESTNET', () => {
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
    it('should get all valid chainIds on TESTNET', () => {
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
  describe('prepareSignatureBody', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should prepare web3 pre sign up payload and return typed structured data', async () => {
      const expectedData: SignatureBodyDto = {
        from: MOCK_ADDRESS,
        to: MOCK_ADDRESS,
        contents: 'signup',
      };

      const result = await web3Service.prepareSignatureBody(
        SignatureType.SIGNUP,
        MOCK_ADDRESS,
      );

      expect(result).toStrictEqual(expectedData);
    });
  });
});
