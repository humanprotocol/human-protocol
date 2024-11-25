import { Test, TestingModule } from '@nestjs/testing';
import { CronJobService } from './cron-job.service';
import { HttpStatus, Logger } from '@nestjs/common';
import { CronJobRepository } from './cron-job.repository';
import { WebhookService } from '../webhook/webhook.service';
import { CronJobEntity } from './cron-job.entity';
import { CronJobType } from '../../common/enums/cron-job';
import { ErrorCronJob } from '../../common/constants/errors';
import { ControlledError } from '../../common/errors/controlled';

describe('CronJobService', () => {
  let service: CronJobService;
  let cronJobRepository: jest.Mocked<CronJobRepository>;
  let webhookService: jest.Mocked<WebhookService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobService,
        {
          provide: CronJobRepository,
          useValue: {
            findOneByType: jest.fn(),
            createUnique: jest.fn(),
            updateOne: jest.fn(),
          },
        },
        {
          provide: WebhookService,
          useValue: {
            processPendingIncomingWebhooks: jest.fn(),
            processPendingEscrowCompletion: jest.fn(),
            processPaidEscrowCompletion: jest.fn(),
            processPendingOutgoingWebhooks: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CronJobService>(CronJobService);
    cronJobRepository = module.get(CronJobRepository);
    webhookService = module.get(WebhookService);
  });

  describe('startCronJob', () => {
    it('should create a new cron job if none exists', async () => {
      cronJobRepository.findOneByType.mockResolvedValue(null);
      cronJobRepository.createUnique.mockResolvedValue(new CronJobEntity());

      const result = await service.startCronJob(
        CronJobType.ProcessPendingIncomingWebhook,
      );

      expect(cronJobRepository.findOneByType).toHaveBeenCalledWith(
        CronJobType.ProcessPendingIncomingWebhook,
      );
      expect(cronJobRepository.createUnique).toHaveBeenCalled();
      expect(result).toBeInstanceOf(CronJobEntity);
    });

    it('should update an existing cron job', async () => {
      const existingCronJob = new CronJobEntity();
      existingCronJob.startedAt = new Date();
      cronJobRepository.findOneByType.mockResolvedValue(existingCronJob);

      const updatedCronJob = {
        ...existingCronJob,
        startedAt: new Date(),
        completedAt: null,
      };
      cronJobRepository.updateOne.mockResolvedValue(updatedCronJob as any);

      const result = await service.startCronJob(
        CronJobType.ProcessPendingIncomingWebhook,
      );

      expect(cronJobRepository.findOneByType).toHaveBeenCalledWith(
        CronJobType.ProcessPendingIncomingWebhook,
      );
      expect(cronJobRepository.updateOne).toHaveBeenCalledWith(updatedCronJob);
      expect(result).toEqual(updatedCronJob);
    });
  });

  describe('isCronJobRunning', () => {
    it('should return false if no cron job exists', async () => {
      cronJobRepository.findOneByType.mockResolvedValue(null);

      const result = await service.isCronJobRunning(
        CronJobType.ProcessPendingIncomingWebhook,
      );

      expect(cronJobRepository.findOneByType).toHaveBeenCalledWith(
        CronJobType.ProcessPendingIncomingWebhook,
      );
      expect(result).toBe(false);
    });

    it('should return false if the last cron job is completed', async () => {
      const completedCronJob = new CronJobEntity();
      completedCronJob.completedAt = new Date();
      cronJobRepository.findOneByType.mockResolvedValue(completedCronJob);

      const result = await service.isCronJobRunning(
        CronJobType.ProcessPendingIncomingWebhook,
      );

      expect(cronJobRepository.findOneByType).toHaveBeenCalledWith(
        CronJobType.ProcessPendingIncomingWebhook,
      );
      expect(result).toBe(false);
    });

    it('should return true if the last cron job is not completed', async () => {
      const runningCronJob = new CronJobEntity();
      cronJobRepository.findOneByType.mockResolvedValue(runningCronJob);

      const result = await service.isCronJobRunning(
        CronJobType.ProcessPendingIncomingWebhook,
      );

      expect(cronJobRepository.findOneByType).toHaveBeenCalledWith(
        CronJobType.ProcessPendingIncomingWebhook,
      );
      expect(result).toBe(true);
    });
  });

  describe('completeCronJob', () => {
    it('should complete a cron job', async () => {
      const cronJobEntity = new CronJobEntity();
      const completedCronJob = { ...cronJobEntity, completedAt: new Date() };
      cronJobRepository.updateOne.mockResolvedValue(completedCronJob as any);

      const result = await service.completeCronJob(cronJobEntity);

      expect(cronJobRepository.updateOne).toHaveBeenCalledWith(
        completedCronJob,
      );
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('should throw an error if the cron job is already completed', async () => {
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.completedAt = new Date();

      await expect(service.completeCronJob(cronJobEntity)).rejects.toThrow(
        new ControlledError(ErrorCronJob.Completed, HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('processPendingIncomingWebhooks', () => {
    it('should skip processing if a cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(true);

      await service.processPendingIncomingWebhooks();

      expect(
        webhookService.processPendingIncomingWebhooks,
      ).not.toHaveBeenCalled();
    });

    it('should process pending webhooks and complete the cron job', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValue(new CronJobEntity());
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValue(new CronJobEntity());

      await service.processPendingIncomingWebhooks();

      expect(webhookService.processPendingIncomingWebhooks).toHaveBeenCalled();
      expect(service.startCronJob).toHaveBeenCalled();
      expect(service.completeCronJob).toHaveBeenCalled();
    });

    it('should log errors during processing', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValue(new CronJobEntity());
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValue(new CronJobEntity());

      webhookService.processPendingIncomingWebhooks.mockRejectedValue(
        new Error('Processing error'),
      );

      await service.processPendingIncomingWebhooks();

      expect(service.completeCronJob).toHaveBeenCalled();
    });
  });

  describe('processPendingEscrowCompletion', () => {
    it('should skip processing if a cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(true);

      await service.processPendingEscrowCompletion();

      expect(
        webhookService.processPendingEscrowCompletion,
      ).not.toHaveBeenCalled();
    });

    it('should process pending escrow completion and complete the cron job', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValue(new CronJobEntity());
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValue(new CronJobEntity());

      await service.processPendingEscrowCompletion();

      expect(webhookService.processPendingEscrowCompletion).toHaveBeenCalled();
      expect(service.startCronJob).toHaveBeenCalled();
      expect(service.completeCronJob).toHaveBeenCalled();
    });

    it('should log errors during processing', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValue(new CronJobEntity());
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValue(new CronJobEntity());

      webhookService.processPendingEscrowCompletion.mockRejectedValue(
        new Error('Processing error'),
      );

      await service.processPendingEscrowCompletion();

      expect(service.completeCronJob).toHaveBeenCalled();
    });
  });

  describe('processPaidEscrowCompletion', () => {
    it('should skip processing if a cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(true);

      await service.processPaidEscrowCompletion();

      expect(webhookService.processPaidEscrowCompletion).not.toHaveBeenCalled();
    });

    it('should process paid escrow completion and complete the cron job', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValue(new CronJobEntity());
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValue(new CronJobEntity());

      await service.processPaidEscrowCompletion();

      expect(webhookService.processPaidEscrowCompletion).toHaveBeenCalled();
      expect(service.startCronJob).toHaveBeenCalled();
      expect(service.completeCronJob).toHaveBeenCalled();
    });

    it('should log errors during processing', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValue(new CronJobEntity());
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValue(new CronJobEntity());

      webhookService.processPaidEscrowCompletion.mockRejectedValue(
        new Error('Processing error'),
      );

      await service.processPaidEscrowCompletion();

      expect(service.completeCronJob).toHaveBeenCalled();
    });
  });

  describe('processPendingOutgoingWebhooks', () => {
    it('should skip processing if a cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(true);

      await service.processPendingOutgoingWebhooks();

      expect(
        webhookService.processPendingOutgoingWebhooks,
      ).not.toHaveBeenCalled();
    });

    it('should process pending outgoing webhooks and complete the cron job', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValue(new CronJobEntity());
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValue(new CronJobEntity());

      await service.processPendingOutgoingWebhooks();

      expect(webhookService.processPendingOutgoingWebhooks).toHaveBeenCalled();
      expect(service.startCronJob).toHaveBeenCalled();
      expect(service.completeCronJob).toHaveBeenCalled();
    });

    it('should log errors during processing', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValue(new CronJobEntity());
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValue(new CronJobEntity());

      webhookService.processPendingOutgoingWebhooks.mockRejectedValue(
        new Error('Processing error'),
      );

      await service.processPendingOutgoingWebhooks();

      expect(service.completeCronJob).toHaveBeenCalled();
    });
  });
});
