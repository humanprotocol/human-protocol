import { ChainId } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_PRIVATE_KEY,
  mockConfig,
} from '../../../test/constants';
import { ErrorWeb3 } from '../../common/constants/errors';
import { Web3Service } from './web3.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { HttpStatus } from '@nestjs/common';
import { ControlledError } from '../../common/errors/controlled';

describe('Web3Service', () => {
  let web3Service: Web3Service;

  jest
    .spyOn(Web3ConfigService.prototype, 'privateKey', 'get')
    .mockReturnValue(MOCK_PRIVATE_KEY);

  jest
    .spyOn(NetworkConfigService.prototype, 'networks', 'get')
    .mockReturnValue([
      {
        chainId: ChainId.POLYGON_AMOY,
        rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/1234567890',
      },
    ]);

  beforeEach(async () => {
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
        new ControlledError(ErrorWeb3.InvalidChainId, HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getOperatorAddress', () => {
    it('should get the operator address', () => {
      const operatorAddress = web3Service.getOperatorAddress();
      expect(operatorAddress).toBe(MOCK_ADDRESS);
    });
  });
});
