jest.mock('@human-protocol/sdk');

import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { EscrowClient } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';

import { ReputationConfigService } from '../../config/reputation-config.service';
import { Web3ConfigService } from '../../config/web3-config.service';

import {
  generateTestnetChainId,
  mockWeb3ConfigService,
} from '../web3/fixtures';
import { Web3Service } from '../web3/web3.service';

import {
  generateReputationEntity,
  generateReputationEntityType,
} from './fixtures';
import { ReputationService } from './reputation.service';
import { ReputationRepository } from './reputation.repository';
import { ReputationEntityType } from './constants';

const mockReputationRepository = createMock<ReputationRepository>();

const LOW_REPUTATION_SCORE = faker.number.int({ min: 100, max: 300 });
const HIGH_REPUTATION_SCORE = faker.number.int({
  min: LOW_REPUTATION_SCORE * 2,
  max: LOW_REPUTATION_SCORE * 3,
});
const mockReputationConfigService: Omit<
  ReputationConfigService,
  'configService'
> = {
  lowLevel: LOW_REPUTATION_SCORE,
  highLevel: HIGH_REPUTATION_SCORE,
};

const mockedEscrowClient = jest.mocked(EscrowClient);

describe('ReputationService', () => {
  let service: ReputationService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReputationService,
        {
          provide: ReputationConfigService,
          useValue: mockReputationConfigService,
        },
        {
          provide: ReputationRepository,
          useValue: mockReputationRepository,
        },
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
        Web3Service,
      ],
    }).compile();

    service = moduleRef.get<ReputationService>(ReputationService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getReputations', () => {
    it('should return reputations data with proper score level', async () => {
      const withLowScore = generateReputationEntity(LOW_REPUTATION_SCORE);
      const withMediumScore = generateReputationEntity(
        faker.number.int({
          min: LOW_REPUTATION_SCORE + 1,
          max: HIGH_REPUTATION_SCORE - 1,
        }),
      );
      const withHighScore = generateReputationEntity(HIGH_REPUTATION_SCORE);

      mockReputationRepository.findPaginated.mockResolvedValueOnce([
        withLowScore,
        withMediumScore,
        withHighScore,
      ]);

      const reputations = await service.getReputations({});
      expect(reputations[0]).toEqual({
        chainId: withLowScore.chainId,
        address: withLowScore.address,
        role: withLowScore.type,
        level: 'low',
      });
      expect(reputations[1]).toEqual({
        chainId: withMediumScore.chainId,
        address: withMediumScore.address,
        role: withMediumScore.type,
        level: 'medium',
      });
      expect(reputations[2]).toEqual({
        chainId: withHighScore.chainId,
        address: withHighScore.address,
        role: withHighScore.type,
        level: 'high',
      });
    });
  });

  describe('increaseReputation', () => {
    it.each([faker.number.float(), faker.number.int() * -1])(
      'throws for invalid score points [%#]',
      async (score) => {
        await expect(
          service.increaseReputation(
            {
              chainId: generateTestnetChainId(),
              address: faker.finance.ethereumAddress(),
              type: generateReputationEntityType(),
            },
            score,
          ),
        ).rejects.toThrow(
          'Adjustable reputation points must be positive integer',
        );
      },
    );

    it('creates entity if not exists and increases reputation', async () => {
      mockReputationRepository.findExclusive.mockResolvedValueOnce(null);

      const criteria = {
        chainId: generateTestnetChainId(),
        address: faker.finance.ethereumAddress(),
        type: generateReputationEntityType(),
      };
      const score = faker.number.int({ min: 1 });

      await service.increaseReputation(criteria, score);

      expect(mockReputationRepository.createUnique).toHaveBeenCalledTimes(1);
      expect(mockReputationRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          ...criteria,
          reputationPoints: 0,
        }),
      );

      expect(mockReputationRepository.increment).toHaveBeenCalledTimes(1);
      expect(mockReputationRepository.increment).toHaveBeenCalledWith(
        criteria,
        'reputationPoints',
        score,
      );
    });

    it('creates entity if not exists and increases reputation for current reputation oracle', async () => {
      mockReputationRepository.findExclusive.mockResolvedValueOnce(null);

      const criteria = {
        chainId: generateTestnetChainId(),
        address: mockWeb3ConfigService.operatorAddress,
        type: ReputationEntityType.REPUTATION_ORACLE,
      };
      const score = faker.number.int({ min: 1 });

      await service.increaseReputation(criteria, score);

      expect(mockReputationRepository.createUnique).toHaveBeenCalledTimes(1);
      expect(mockReputationRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          ...criteria,
          reputationPoints: mockReputationConfigService.highLevel,
        }),
      );

      expect(mockReputationRepository.increment).toHaveBeenCalledTimes(1);
      expect(mockReputationRepository.increment).toHaveBeenCalledWith(
        criteria,
        'reputationPoints',
        score,
      );
    });

    it('increases reputation if entity already exists', async () => {
      const reputationEntity = generateReputationEntity();
      mockReputationRepository.findExclusive.mockResolvedValueOnce(
        reputationEntity,
      );

      const criteria = {
        chainId: reputationEntity.chainId,
        address: reputationEntity.address,
        type: reputationEntity.type,
      };
      const score = faker.number.int({ min: 1 });

      await service.increaseReputation(criteria, score);

      expect(mockReputationRepository.createUnique).not.toHaveBeenCalled();

      expect(mockReputationRepository.increment).toHaveBeenCalledTimes(1);
      expect(mockReputationRepository.increment).toHaveBeenCalledWith(
        criteria,
        'reputationPoints',
        score,
      );
    });
  });

  describe('decreaseReputation', () => {
    it.each([faker.number.float(), faker.number.int() * -1])(
      'throws for invalid score points [%#]',
      async (score) => {
        await expect(
          service.decreaseReputation(
            {
              chainId: generateTestnetChainId(),
              address: faker.finance.ethereumAddress(),
              type: generateReputationEntityType(),
            },
            score,
          ),
        ).rejects.toThrow(
          'Adjustable reputation points must be positive integer',
        );
      },
    );

    it('creates entity if not exists and decreases reputation', async () => {
      mockReputationRepository.findExclusive.mockResolvedValueOnce(null);

      const criteria = {
        chainId: generateTestnetChainId(),
        address: faker.finance.ethereumAddress(),
        type: generateReputationEntityType(),
      };
      const score = faker.number.int({ min: 1 });

      await service.decreaseReputation(criteria, score);

      expect(mockReputationRepository.createUnique).toHaveBeenCalledTimes(1);
      expect(mockReputationRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          ...criteria,
          reputationPoints: 0,
        }),
      );

      expect(mockReputationRepository.decrement).toHaveBeenCalledTimes(1);
      expect(mockReputationRepository.decrement).toHaveBeenCalledWith(
        criteria,
        'reputationPoints',
        score,
      );
    });

    it('should not decrease reputation for current reputation oracle', async () => {
      const criteria = {
        chainId: generateTestnetChainId(),
        address: mockWeb3ConfigService.operatorAddress,
        type: ReputationEntityType.REPUTATION_ORACLE,
      };
      const score = faker.number.int({ min: 1 });

      await service.decreaseReputation(criteria, score);

      expect(mockReputationRepository.createUnique).not.toHaveBeenCalled();

      expect(mockReputationRepository.decrement).not.toHaveBeenCalled();
    });
  });

  describe('assessEscrowParties', () => {
    let spyOnIncreaseReputation: jest.SpyInstance;

    beforeAll(() => {
      spyOnIncreaseReputation = jest.spyOn(service, 'increaseReputation');
    });

    afterAll(() => {
      spyOnIncreaseReputation.mockRestore();
    });

    it('should increase reputation for escrow oracles by one', async () => {
      const jobLauncherAddress = faker.finance.ethereumAddress();
      const exchangeOracleAddress = faker.finance.ethereumAddress();
      const recordingOracleAddress = faker.finance.ethereumAddress();

      mockedEscrowClient.build.mockResolvedValueOnce({
        getExchangeOracleAddress: jest
          .fn()
          .mockResolvedValueOnce(exchangeOracleAddress),
        getJobLauncherAddress: jest
          .fn()
          .mockResolvedValueOnce(jobLauncherAddress),
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValueOnce(recordingOracleAddress),
      } as unknown as EscrowClient);

      const chainId = generateTestnetChainId();
      const escrowAddress = faker.finance.ethereumAddress();

      await service.assessEscrowParties(chainId, escrowAddress);

      expect(spyOnIncreaseReputation).toHaveBeenCalledTimes(4);
      expect(spyOnIncreaseReputation).toHaveBeenCalledWith(
        {
          chainId,
          address: jobLauncherAddress,
          type: ReputationEntityType.JOB_LAUNCHER,
        },
        1,
      );
      expect(spyOnIncreaseReputation).toHaveBeenCalledWith(
        {
          chainId,
          address: exchangeOracleAddress,
          type: ReputationEntityType.EXCHANGE_ORACLE,
        },
        1,
      );
      expect(spyOnIncreaseReputation).toHaveBeenCalledWith(
        {
          chainId,
          address: recordingOracleAddress,
          type: ReputationEntityType.RECORDING_ORACLE,
        },
        1,
      );
      expect(spyOnIncreaseReputation).toHaveBeenCalledWith(
        {
          chainId,
          address: mockWeb3ConfigService.operatorAddress,
          type: ReputationEntityType.REPUTATION_ORACLE,
        },
        1,
      );
    });
  });
});
