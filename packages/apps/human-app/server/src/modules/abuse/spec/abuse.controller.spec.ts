import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';

import { AbuseController } from '../abuse.controller';
import { AbuseService } from '../abuse.service';
import { abuseServiceMock } from './abuse.service.mock';
import {
  reportAbuseCommandFixture,
  reportAbuseDtoFixture,
  reportedAbuseResponseFixture,
  TOKEN,
} from './abuse.fixtures';
import { AbuseProfile } from '../abuse.mapper.profile';
import { RequestWithUser } from '../../../common/interfaces/jwt';

describe('AbuseController', () => {
  let controller: AbuseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AbuseController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [AbuseService, AbuseProfile],
    })
      .overrideProvider(AbuseService)
      .useValue(abuseServiceMock)
      .compile();

    controller = module.get<AbuseController>(AbuseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('reportAbuse', () => {
    it('should call service reportAbuse method with proper fields set', async () => {
      const dto = reportAbuseDtoFixture;
      const command = reportAbuseCommandFixture;

      await controller.reportAbuse(dto, {
        token: TOKEN,
      } as RequestWithUser);

      expect(abuseServiceMock.reportAbuse).toHaveBeenCalledWith(command);
    });
  });

  describe('getUserAbuseReports', () => {
    it('should call service getUserAbuseReports method with the token', async () => {
      const token = TOKEN;

      abuseServiceMock.getUserAbuseReports.mockResolvedValueOnce(
        reportedAbuseResponseFixture,
      );

      const result = await controller.getUserAbuseReports({
        token: TOKEN,
      } as RequestWithUser);

      expect(abuseServiceMock.getUserAbuseReports).toHaveBeenCalledWith(token);
      expect(result).toEqual(reportedAbuseResponseFixture);
    });
  });
});
