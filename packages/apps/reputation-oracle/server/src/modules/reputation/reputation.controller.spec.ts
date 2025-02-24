import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';
import { ReputationRepository } from './reputation.repository';
import { ReputationLevel } from '../../common/enums';
import { ReputationDto } from './reputation.dto';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { MOCK_ADDRESS, mockConfig } from '../../../test/constants';
import { ReputationConfigService } from '../../config/reputation-config.service';
import { S3ConfigService } from '../../config/s3-config.service';
import { PGPConfigService } from '../../config/pgp-config.service';

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
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(registerAs('s3', () => mockConfig))],
      providers: [
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
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
        ReputationConfigService,
        S3ConfigService,
        PGPConfigService,
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
        .spyOn(reputationService, 'getReputations')
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
