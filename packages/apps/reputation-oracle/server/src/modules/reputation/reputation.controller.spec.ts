import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';
import { ReputationEntity } from './reputation.entity';
import { ReputationRepository } from './reputation.repository';
import { ReputationLevel } from '../../common/enums';
import { ConfigNames } from '../../common/config';
import { IReputation } from 'src/common/interfaces';

const OPERATOR_ADDRESS = 'TEST_OPERATOR_ADDRESS';
const CHAIN_ID = 1;

describe('ReputationController', () => {
  let reputationController: ReputationController;
  let reputationService: ReputationService;

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
      providers: [
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
        .mockResolvedValueOnce(results as IReputation[]);

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
      const result = { chainId: CHAIN_ID, address: OPERATOR_ADDRESS, reputation: ReputationLevel.LOW }

      jest
        .spyOn(reputationService, 'getReputation')
        .mockResolvedValueOnce(result as IReputation);

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