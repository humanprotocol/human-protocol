import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { HCaptchaController } from '../h-captcha.controller';
import { HCaptchaService } from '../h-captcha.service';
import { HCaptchaMapperProfile } from '../h-captcha.mapper.profile';
import { hCaptchaServiceMock } from './h-captcha.service.mock';
import {
  dailyHmtSpentCommandFixture,
  enableLabelingCommandFixture,
  hCaptchaUserStatsCommandFixture,
  JWT_TOKEN,
  jwtUserDataFixture,
  verifyTokenCommandFixture,
  verifyTokenDtoFixture,
} from './h-captcha.fixtures';
import { RequestWithUser } from '../../../common/interfaces/jwt';

describe('HCaptchaController', () => {
  let controller: HCaptchaController;
  let service: HCaptchaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HCaptchaController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [HCaptchaService, HCaptchaMapperProfile],
    })
      .overrideProvider(HCaptchaService)
      .useValue(hCaptchaServiceMock)
      .compile();

    controller = module.get<HCaptchaController>(HCaptchaController);
    service = module.get<HCaptchaService>(HCaptchaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  it('should call getUserStats with proper arguments', async () => {
    const dto = { user: jwtUserDataFixture } as RequestWithUser;
    const command = hCaptchaUserStatsCommandFixture;
    await controller.getUserStats(dto);
    expect(service.getUserStats).toHaveBeenCalledWith(command);
  });

  it('should call verifyToken with proper arguments', async () => {
    const dto = verifyTokenDtoFixture;
    const jwtPayload = {
      user: jwtUserDataFixture,
      token: JWT_TOKEN,
    } as RequestWithUser;
    const command = verifyTokenCommandFixture;
    await controller.verifyToken(dto, jwtPayload);
    expect(service.verifyToken).toHaveBeenCalledWith(command);
  });

  it('should call getDailyHmtSpent with proper arguments', async () => {
    const dto = {
      user: jwtUserDataFixture,
      token: JWT_TOKEN,
    } as RequestWithUser;
    const command = dailyHmtSpentCommandFixture;
    await controller.getDailyHmtSpent(dto);
    expect(service.getDailyHmtSpent).toHaveBeenCalledWith(command);
  });

  it('should call enableLabeling with proper arguments', async () => {
    const command = enableLabelingCommandFixture;
    await controller.enableLabeling({
      token: JWT_TOKEN,
    } as RequestWithUser);
    expect(service.enableLabeling).toHaveBeenCalledWith(command);
  });
});
