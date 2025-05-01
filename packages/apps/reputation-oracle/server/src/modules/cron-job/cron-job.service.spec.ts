import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { AbuseService } from '../abuse/abuse.service';
import { EscrowCompletionService } from '../escrow-completion/escrow-completion.service';
import { OutgoingWebhookService } from '../webhook/webhook-outgoing.service';
import { IncomingWebhookService } from '../webhook/webhook-incoming.service';

import { CronJobType } from './constants';
import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';
import { CronJobService } from './cron-job.service';
import { generateCronJob } from './fixtures';

const mockedCronJobRepository = createMock<CronJobRepository>();
const mockedIncomingWebhookService = createMock<IncomingWebhookService>();
const mockedOutgoingWebhookService = createMock<OutgoingWebhookService>();
const mockedEscrowCompletionService = createMock<EscrowCompletionService>();
const mockedAbuseService = createMock<AbuseService>();

describe('CronJobService', () => {
  let service: CronJobService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobService,
        {
          provide: CronJobRepository,
          useValue: mockedCronJobRepository,
        },
        {
          provide: IncomingWebhookService,
          useValue: mockedIncomingWebhookService,
        },
        {
          provide: OutgoingWebhookService,
          useValue: mockedOutgoingWebhookService,
        },
        {
          provide: EscrowCompletionService,
          useValue: mockedEscrowCompletionService,
        },
        {
          provide: AbuseService,
          useValue: mockedAbuseService,
        },
      ],
    }).compile();

    service = module.get<CronJobService>(CronJobService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('startCronJob', () => {
    const now = Date.now();

    beforeAll(() => {
      jest.useFakeTimers({ now });
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    beforeEach(() => {
      mockedCronJobRepository.createUnique.mockImplementation(async (v) => v);
      mockedCronJobRepository.updateOne.mockImplementation(async (v) => v);
    });

    it('should create a new cron job if none exists', async () => {
      mockedCronJobRepository.findOneByType.mockResolvedValueOnce(null);

      const result = await service.startCronJob(
        CronJobType.ProcessPendingIncomingWebhook,
      );

      expect(mockedCronJobRepository.findOneByType).toHaveBeenCalledWith(
        CronJobType.ProcessPendingIncomingWebhook,
      );
      const expectedJobData = {
        cronJobType: CronJobType.ProcessPendingIncomingWebhook,
        startedAt: new Date(now),
      };
      expect(mockedCronJobRepository.createUnique).toHaveBeenCalledTimes(1);
      expect(mockedCronJobRepository.createUnique).toHaveBeenCalledWith(
        expectedJobData,
      );
      expect(result).toBeInstanceOf(CronJobEntity);
      expect(result).toEqual(expect.objectContaining(expectedJobData));
    });

    it('should update an existing cron job', async () => {
      const existingCronJob = generateCronJob();
      mockedCronJobRepository.findOneByType.mockResolvedValueOnce({
        ...existingCronJob,
      });

      const result = await service.startCronJob(existingCronJob.cronJobType);

      const updatedCronJob = {
        ...existingCronJob,
        startedAt: new Date(now),
        completedAt: null,
      };
      expect(mockedCronJobRepository.findOneByType).toHaveBeenCalledWith(
        existingCronJob.cronJobType,
      );
      expect(mockedCronJobRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockedCronJobRepository.updateOne).toHaveBeenCalledWith(
        updatedCronJob,
      );
      expect(result).toEqual(updatedCronJob);
    });
  });

  describe('isCronJobRunning', () => {
    it('should return false if no cron job exists', async () => {
      mockedCronJobRepository.findOneByType.mockResolvedValueOnce(null);

      const result = await service.isCronJobRunning(
        CronJobType.ProcessPendingIncomingWebhook,
      );

      expect(mockedCronJobRepository.findOneByType).toHaveBeenCalledWith(
        CronJobType.ProcessPendingIncomingWebhook,
      );
      expect(result).toBe(false);
    });

    it('should return false if the last cron job is completed', async () => {
      const completedCronJob = new CronJobEntity();
      completedCronJob.completedAt = new Date();
      mockedCronJobRepository.findOneByType.mockResolvedValueOnce(
        completedCronJob,
      );

      const result = await service.isCronJobRunning(
        CronJobType.ProcessPendingIncomingWebhook,
      );

      expect(mockedCronJobRepository.findOneByType).toHaveBeenCalledWith(
        CronJobType.ProcessPendingIncomingWebhook,
      );
      expect(result).toBe(false);
    });

    it('should return true if the last cron job is not completed', async () => {
      const runningCronJob = new CronJobEntity();
      mockedCronJobRepository.findOneByType.mockResolvedValueOnce(
        runningCronJob,
      );

      const result = await service.isCronJobRunning(
        CronJobType.ProcessPendingIncomingWebhook,
      );

      expect(mockedCronJobRepository.findOneByType).toHaveBeenCalledWith(
        CronJobType.ProcessPendingIncomingWebhook,
      );
      expect(result).toBe(true);
    });
  });

  describe('completeCronJob', () => {
    const now = Date.now();

    beforeAll(() => {
      jest.useFakeTimers({ now });
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    beforeEach(() => {
      mockedCronJobRepository.updateOne.mockImplementation(async (v) => v);
    });

    it('should complete a cron job', async () => {
      const cronJobEntity = new CronJobEntity();

      const result = await service.completeCronJob({
        ...cronJobEntity,
      });

      const completedCronJob = {
        ...cronJobEntity,
        completedAt: new Date(now),
      };
      expect(mockedCronJobRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockedCronJobRepository.updateOne).toHaveBeenCalledWith(
        completedCronJob,
      );
      expect(result).toEqual(completedCronJob);
    });
  });

  describe('cron job handlers', () => {
    let spyOnIsCronJobRunning: jest.SpyInstance;
    let spyOnStartCronJob: jest.SpyInstance;
    let spyOnCompleteCronJob: jest.SpyInstance;

    beforeAll(() => {
      spyOnIsCronJobRunning = jest
        .spyOn(service, 'isCronJobRunning')
        .mockImplementation();
      spyOnStartCronJob = jest
        .spyOn(service, 'startCronJob')
        .mockImplementation();
      spyOnCompleteCronJob = jest
        .spyOn(service, 'completeCronJob')
        .mockImplementation();
    });

    afterAll(() => {
      spyOnIsCronJobRunning.mockRestore();
      spyOnStartCronJob.mockRestore();
      spyOnCompleteCronJob.mockRestore();
    });

    describe.each([
      {
        method: 'processPendingIncomingWebhooks',
        cronJobType: 'process-pending-incoming-webhook',
        processorMock:
          mockedIncomingWebhookService.processPendingIncomingWebhooks,
      },
      {
        method: 'processPendingEscrowCompletion',
        cronJobType: 'process-pending-escrow-completion-tracking',
        processorMock: mockedEscrowCompletionService.processPendingRecords,
      },
      {
        method: 'processAwaitingEscrowPayouts',
        cronJobType: 'process-awaiting-escrow-payouts',
        processorMock: mockedEscrowCompletionService.processAwaitingPayouts,
      },
      {
        method: 'processPaidEscrowCompletion',
        cronJobType: 'process-paid-escrow-completion-tracking',
        processorMock: mockedEscrowCompletionService.processPaidEscrows,
      },
      {
        method: 'processPendingOutgoingWebhooks',
        cronJobType: 'process-pending-outgoing-webhook',
        processorMock:
          mockedOutgoingWebhookService.processPendingOutgoingWebhooks,
      },
      {
        method: 'processAbuseRequests',
        cronJobType: 'process-requested-abuse',
        processorMock: mockedAbuseService.processAbuseRequests,
      },
      {
        method: 'processClassifiedAbuses',
        cronJobType: 'process-classified-abuse',
        processorMock: mockedAbuseService.processClassifiedAbuses,
      },
    ])('$method', ({ method, cronJobType, processorMock }) => {
      let cronJob: CronJobEntity;

      beforeEach(() => {
        cronJob = generateCronJob({
          cronJobType: cronJobType as CronJobType,
        });
      });

      it('should skip processing if a cron job is already running', async () => {
        spyOnIsCronJobRunning.mockResolvedValueOnce(true);

        await (service as any)[method]();

        expect(spyOnIsCronJobRunning).toHaveBeenCalledTimes(1);
        expect(spyOnIsCronJobRunning).toHaveBeenCalledWith(cronJobType);
        expect(processorMock).not.toHaveBeenCalled();
        expect(spyOnStartCronJob).not.toHaveBeenCalled();
        expect(spyOnCompleteCronJob).not.toHaveBeenCalled();
      });

      it(`should process ${cronJobType} and complete the cron job`, async () => {
        spyOnIsCronJobRunning.mockResolvedValueOnce(false);
        spyOnStartCronJob.mockResolvedValueOnce(cronJob);

        await (service as any)[method]();

        expect(service.startCronJob).toHaveBeenCalledTimes(1);
        expect(service.startCronJob).toHaveBeenCalledWith(cronJobType);

        expect(processorMock).toHaveBeenCalledTimes(1);

        expect(service.completeCronJob).toHaveBeenCalledTimes(1);
        expect(service.completeCronJob).toHaveBeenCalledWith(cronJob);
      });

      it('should complete the cron job when processing fails', async () => {
        spyOnIsCronJobRunning.mockResolvedValueOnce(false);
        spyOnStartCronJob.mockResolvedValueOnce(cronJob);

        mockedIncomingWebhookService.processPendingIncomingWebhooks.mockRejectedValueOnce(
          new Error(faker.lorem.sentence()),
        );

        await (service as any)[method]();

        expect(service.completeCronJob).toHaveBeenCalledTimes(1);
        expect(service.completeCronJob).toHaveBeenCalledWith(cronJob);
      });
    });
  });
});
