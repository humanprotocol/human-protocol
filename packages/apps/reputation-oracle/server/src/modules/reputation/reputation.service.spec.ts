import { Test } from '@nestjs/testing';
import { ReputationService } from './reputation.service';
import { ReputationRepository } from './reputation.repository';
import { ChainId } from '@human-protocol/sdk';
import { ReputationEntity } from './reputation.entity';
import { MOCK_ADDRESS } from '../../../test/constants';
import { WebhookRepository } from '../webhook/webhook.repository';
import { createMock } from '@golevelup/ts-jest';
import { ReputationEntityType, ReputationLevel } from '../../common/enums';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../../common/config';

describe('ReputationService', () => {
  let reputationService: ReputationService,
    reputationRepository: ReputationRepository;

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case ConfigNames.REPUTATION_LEVEL_LOW:
            return 300;
          case ConfigNames.REPUTATION_LEVEL_HIGH:
            return 700;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReputationService,
        {
          provide: ReputationRepository,
          useValue: createMock<ReputationRepository>(),
        },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    reputationService = moduleRef.get<ReputationService>(ReputationService);
    reputationRepository = moduleRef.get(ReputationRepository);
  });

  describe('increaseReputation', () => {
    const chainId = ChainId.LOCALHOST;
    const address = MOCK_ADDRESS;
    const type = ReputationEntityType.WORKER;

    it('should create a new reputation entity if not found', async () => {
      jest
        .spyOn(reputationRepository, 'findOne')
        .mockResolvedValueOnce(undefined as any);
      jest.spyOn(reputationRepository, 'create');

      await reputationService.increaseReputation(chainId, address, type);

      expect(reputationRepository.findOne).toHaveBeenCalledWith({ address });
      expect(reputationRepository.create).toHaveBeenCalledWith({
        chainId,
        address,
        reputationPoints: 1,
        type,
      });
    });

    it('should increase reputation points if entity found', async () => {
      const reputationEntity: Partial<ReputationEntity> = {
        address,
        reputationPoints: 1,
        save: jest.fn(),
      };

      jest
        .spyOn(reputationRepository, 'findOne')
        .mockResolvedValueOnce(reputationEntity as ReputationEntity);

      await reputationService.increaseReputation(chainId, address, type);

      expect(reputationRepository.findOne).toHaveBeenCalledWith({ address });
      expect(reputationEntity.reputationPoints).toBe(2);
      expect(reputationEntity.save).toHaveBeenCalled();
    });
  });

  describe('decreaseReputation', () => {
    const chainId = ChainId.LOCALHOST;
    const address = MOCK_ADDRESS;
    const type = ReputationEntityType.WORKER;

    it('should create a new reputation entity if not found', async () => {
      jest
        .spyOn(reputationRepository, 'findOne')
        .mockResolvedValueOnce(undefined as any);
      jest.spyOn(reputationRepository, 'create');

      await reputationService.decreaseReputation(chainId, address, type);

      expect(reputationRepository.findOne).toHaveBeenCalledWith({ address });
      expect(reputationRepository.create).toHaveBeenCalledWith({
        chainId,
        address,
        reputationPoints: 0,
        type,
      });
    });

    it('should decrease reputation points if entity found', async () => {
      const reputationEntity: Partial<ReputationEntity> = {
        address,
        reputationPoints: 1,
        save: jest.fn(),
      };

      jest
        .spyOn(reputationRepository, 'findOne')
        .mockResolvedValueOnce(reputationEntity as ReputationEntity);

      await reputationService.decreaseReputation(chainId, address, type);

      expect(reputationRepository.findOne).toHaveBeenCalledWith({ address });
      expect(reputationEntity.reputationPoints).toBe(0);
      expect(reputationEntity.save).toHaveBeenCalled();
    });
  });

  describe('getReputationLevel', () => {
    it('should return LOW if reputation points are less than 300', () => {
      expect(reputationService.getReputationLevel(299)).toBe(
        ReputationLevel.LOW,
      );
    });
    it('should return MEDIUM if reputation points are less than 700', () => {
      expect(reputationService.getReputationLevel(699)).toBe(
        ReputationLevel.MEDIUM,
      );
    });

    it('should return HIGH if reputation points are greater than 700', () => {
      expect(reputationService.getReputationLevel(701)).toBe(
        ReputationLevel.HIGH,
      );
    });
  });

  describe('getReputation', () => {
    const chainId = ChainId.LOCALHOST;
    const address = MOCK_ADDRESS;

    it('should return reputation entity', async () => {
      const reputationEntity: Partial<ReputationEntity> = {
        chainId,
        address,
        reputationPoints: 1,
      };

      jest
        .spyOn(reputationRepository, 'findOne')
        .mockResolvedValueOnce(reputationEntity as ReputationEntity);

      const result = await reputationService.getReputation(chainId, address);

      const resultReputation = {
        chainId,
        address,
        reputation: ReputationLevel.LOW,
      }

      expect(reputationRepository.findOne).toHaveBeenCalledWith({
        chainId,
        address,
      });
      expect(result).toEqual(resultReputation);
    });
  });

  describe('getAllReputations', () => {
    const chainId = ChainId.LOCALHOST;
    const address = MOCK_ADDRESS;

    it('should return all reputations', async () => {
      const reputationEntity: Partial<ReputationEntity> = {
        chainId,
        address,
        reputationPoints: 1,
      };

      jest
        .spyOn(reputationRepository, 'find')
        .mockResolvedValueOnce([reputationEntity as ReputationEntity]);

      const result = await reputationService.getAllReputations();

      const resultReputation = {
        chainId,
        address,
        reputation: ReputationLevel.LOW,
      }

      expect(reputationRepository.find).toHaveBeenCalled();
      expect(result).toEqual([resultReputation]);
    });
  });
});