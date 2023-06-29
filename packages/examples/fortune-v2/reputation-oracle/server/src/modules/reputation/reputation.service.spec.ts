import { Test } from '@nestjs/testing';
import { ReputationService } from './reputation.service';
import { ReputationRepository } from './reputation.repository';
import { ReputationEntityType } from '../../common/decorators';
import { ChainId } from '@human-protocol/sdk';
import { ReputationEntity } from './reputation.entity';
import { MOCK_ADDRESS } from '../../common/test/constants';
import { WebhookRepository } from '../webhook/webhook.repository';
import { createMock } from '@golevelup/ts-jest';

describe('ReputationService', () => {
  let reputationService: ReputationService,
    reputationRepository: ReputationRepository;

  beforeEach(async () => {
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
});
