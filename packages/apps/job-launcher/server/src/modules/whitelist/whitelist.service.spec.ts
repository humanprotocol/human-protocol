import { Test } from '@nestjs/testing';
import { WhitelistService } from './whitelist.service';
import { WhitelistRepository } from './whitelist.repository';
import { createMock } from '@golevelup/ts-jest';

describe('WhitelistService', () => {
  let whitelistService: WhitelistService;
  let whitelistRepository: WhitelistRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        WhitelistService,
        {
          provide: WhitelistRepository,
          useValue: createMock<WhitelistRepository>(),
        },
      ],
    }).compile();

    whitelistService = moduleRef.get<WhitelistService>(WhitelistService);
    whitelistRepository =
      moduleRef.get<WhitelistRepository>(WhitelistRepository);
  });

  // TODO: Enable it when billing system is active
  describe('isUserWhitelisted', () => {
    it('should return true if user is whitelisted', async () => {
      const userId = 1;
      jest
        .spyOn(whitelistRepository, 'findOneByUserId')
        .mockResolvedValue({ id: 1, user: { id: userId } as any });

      const result = await whitelistService.isUserWhitelisted(userId);

      // expect(whitelistRepository.findOneByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    // it('should return false if user is not whitelisted', async () => {
    //   const userId = 2;
    //   jest
    //     .spyOn(whitelistRepository, 'findOneByUserId')
    //     .mockResolvedValue(null);

    //   const result = await whitelistService.isUserWhitelisted(userId);

    //   expect(whitelistRepository.findOneByUserId).toHaveBeenCalledWith(userId);
    //   expect(result).toBe(false);
    // });
  });
});
