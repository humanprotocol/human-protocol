import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestWithUser } from '../../../common/interfaces/jwt';
import { TOKEN } from './staking.fixtures';
import { StakingService } from '../staking.service';
import { StakingController } from '../staking.controller';
import { stakingServiceMock } from './staking.service.mock';

describe('StakingController', () => {
  let controller: StakingController;
  let service: StakingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StakingController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
        StakingService,
        {
          provide: StakingService,
          useValue: stakingServiceMock,
        },
      ],
    })
      .overrideProvider(StakingService)
      .useValue(stakingServiceMock)
      .compile();

    controller = module.get<StakingController>(StakingController);
    service = module.get<StakingService>(StakingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStakeSummary', () => {
    it('should call service.getStakeSummary with token and return response', async () => {
      const req: RequestWithUser = { token: TOKEN } as RequestWithUser;
      const result = await controller.getStakeSummary(req);
      expect(service.getStakeSummary).toHaveBeenCalledWith(TOKEN);
      expect(result).toEqual(stakingServiceMock.getStakeSummary(TOKEN));
    });
  });

  describe('getStakeConfig', () => {
    it('should call service.getStakeConfig with token and return response', async () => {
      const req: RequestWithUser = { token: TOKEN } as RequestWithUser;
      const result = await controller.getStakeConfig(req);
      expect(service.getStakeConfig).toHaveBeenCalledWith(TOKEN);
      expect(result).toEqual(stakingServiceMock.getStakeConfig(TOKEN));
    });
  });
});
