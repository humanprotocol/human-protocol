import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ServerConfigService } from '../../common/config/server-config.service';
import { CronJobController } from './cron-job.controller';
import { CronJobService } from './cron-job.service';

jest.mock('../../common/utils/signature');

describe('cronJobController', () => {
  let cronJobController: CronJobController;
  let cronJobService: CronJobService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [CronJobController],
      providers: [
        { provide: CronJobService, useValue: createMock<CronJobService>() },
        ConfigService,
        ServerConfigService,
      ],
    }).compile();

    cronJobController = moduleRef.get<CronJobController>(CronJobController);
    cronJobService = moduleRef.get<CronJobService>(CronJobService);
  });

  describe('processPendingWebhooks', () => {
    it('should call cronJobService.processPendingWebhooks', async () => {
      jest.spyOn(cronJobService, 'processPendingWebhooks').mockResolvedValue();
      const result = await cronJobController.processPendingWebhooks();
      expect(result).toBe(undefined);
      expect(cronJobService.processPendingWebhooks).toHaveBeenCalledWith();
    });
  });
});
