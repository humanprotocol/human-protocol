import { Test } from '@nestjs/testing';

import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';
import { ReputationEntity } from './reputation.entity';
import { ReputationRepository } from './reputation.repository';
import { ReputationScore } from '../../common/enums';

const OPERATOR_ADDRESS = 'TEST_OPERATOR_ADDRESS';
const CHAIN_ID = 1;

describe('ReputationController', () => {
  let reputationController: ReputationController;
  let reputationService: ReputationService;

  beforeAll(async () => {
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
      ],
    }).compile();

    reputationService = moduleRef.get<ReputationService>(ReputationService);
    reputationController = new ReputationController(reputationService);
  });

  describe('getReputations', () => {
    it('should call service for given chainId', async () => {
      const reputations = [
        { chainId: CHAIN_ID, address: OPERATOR_ADDRESS, reputationPoints: 1 },
      ];

      const result = [
        {
          chainId: CHAIN_ID,
          address: OPERATOR_ADDRESS,
          reputation: ReputationScore.LOW,
        },
      ];

      jest
        .spyOn(reputationService, 'getAllReputations')
        .mockResolvedValueOnce(reputations as ReputationEntity[]);

      jest
        .spyOn(reputationService, 'getReputationScore')
        .mockReturnValueOnce(ReputationScore.LOW);

      expect(
        await reputationController.getReputations({ chainId: CHAIN_ID }),
      ).toEqual(result);
    });
  });

  describe('getReputation', () => {
    it('should call service', async () => {
      const reputation = [
        { chainId: CHAIN_ID, address: OPERATOR_ADDRESS, reputationPoints: 1 },
      ];

      jest
        .spyOn(reputationService, 'getReputation')
        .mockResolvedValueOnce(reputation as any as ReputationEntity);

      jest
        .spyOn(reputationService, 'getReputationScore')
        .mockReturnValueOnce(ReputationScore.LOW);

      expect(
        await reputationController.getReputation(
          {
            address: OPERATOR_ADDRESS,
          },
          {
            chainId: CHAIN_ID,
          },
        ),
      ).toBe(ReputationScore.LOW);
    });
  });
});
