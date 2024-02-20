import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';
import { ReputationRepository } from './reputation.repository';
import { ReputationLevel } from '../../common/enums';
import { ConfigNames } from '../../common/config';
import { ReputationDto } from './reputation.dto';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import {
  MOCK_ADDRESS,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
} from '../../../test/constants';

const OPERATOR_ADDRESS = 'TEST_OPERATOR_ADDRESS';
const CHAIN_ID = 1;

describe('ReputationController', () => {
  let reputationController: ReputationController,
    reputationService: ReputationService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case ConfigNames.REPUTATION_LEVEL_LOW:
            return 300;
          case ConfigNames.REPUTATION_LEVEL_LOW:
            return 700;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(
          registerAs('s3', () => ({
            accessKey: MOCK_S3_ACCESS_KEY,
            secretKey: MOCK_S3_SECRET_KEY,
            endPoint: MOCK_S3_ENDPOINT,
            port: MOCK_S3_PORT,
            useSSL: MOCK_S3_USE_SSL,
            bucket: MOCK_S3_BUCKET,
          })),
        ),
      ],
      providers: [
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            validateChainId: jest.fn().mockReturnValue(new Error()),
          },
        },
        StorageService,
        ReputationService,
        {
          provide: ReputationRepository,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    reputationService = moduleRef.get<ReputationService>(ReputationService);
    reputationController = new ReputationController(reputationService);
  });

  describe('getReputations', () => {
    it('should call service for given chainId', async () => {
      const results = [
        {
          chainId: CHAIN_ID,
          address: OPERATOR_ADDRESS,
          reputation: ReputationLevel.LOW,
        },
      ];

      jest
        .spyOn(reputationService, 'getAllReputations')
        .mockResolvedValueOnce(results as ReputationDto[]);

      jest
        .spyOn(reputationService, 'getReputationLevel')
        .mockReturnValueOnce(ReputationLevel.LOW);

      expect(
        await reputationController.getReputations({ chainId: CHAIN_ID }),
      ).toEqual(results);
    });
  });

  describe('getReputation', () => {
    it('should call service', async () => {
      const result = {
        chainId: CHAIN_ID,
        address: OPERATOR_ADDRESS,
        reputation: ReputationLevel.LOW,
      };

      jest
        .spyOn(reputationService, 'getReputation')
        .mockResolvedValueOnce(result as ReputationDto);

      jest
        .spyOn(reputationService, 'getReputationLevel')
        .mockReturnValueOnce(ReputationLevel.LOW);

      expect(
        await reputationController.getReputation(
          {
            address: OPERATOR_ADDRESS,
          },
          {
            chainId: CHAIN_ID,
          },
        ),
      ).toBe(result);
    });
  });
});
