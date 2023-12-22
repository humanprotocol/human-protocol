import { Test, TestingModule } from '@nestjs/testing';

import { CronJobType } from '../../common/enums/cron-job';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';
import { CronJobEntity } from './cron-job.entity';
import { createMock } from '@golevelup/ts-jest';

describe('CronJobService', () => {
  let service: CronJobService;
  let repository: CronJobRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobService,
        {
          provide: CronJobRepository,
          useValue: createMock<CronJobRepository>(),
        },
      ],
    }).compile();

    service = module.get<CronJobService>(CronJobService);
    repository = module.get<CronJobRepository>(CronJobRepository);
  });

  describe('startCronJob', () => {
    it('should create a cron job if not exists', async () => {
      const cronJobType = CronJobType.CreateEscrow;

      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.startedAt = new Date();

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const createSpy = jest
        .spyOn(repository, 'create')
        .mockResolvedValue(cronJobEntity);

      const result = await service.startCronJob(cronJobType);

      expect(createSpy).toHaveBeenCalledWith(cronJobType);
      expect(result).toEqual(cronJobEntity);
    });

    it('should start a cron job if exists', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.startedAt = new Date();
      cronJobEntity.completedAt = new Date();

      const mockDate = new Date(2023, 12, 23);
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(cronJobEntity);

      const saveSpy = jest
        .spyOn(cronJobEntity, 'save')
        .mockResolvedValue(cronJobEntity);

      const result = await service.startCronJob(cronJobType);

      expect(findOneSpy).toHaveBeenCalledWith({
        cronJobType,
      });
      expect(saveSpy).toHaveBeenCalled();
      cronJobEntity.startedAt = mockDate;
      expect(result).toEqual(cronJobEntity);

      jest.useRealTimers();
    });

    it('should throw an error if cron job is not completed', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.startedAt = new Date();

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(cronJobEntity);

      await expect(service.startCronJob(cronJobType)).rejects.toThrow();
      expect(findOneSpy).toHaveBeenCalledWith({
        cronJobType,
      });
    });
  });

  describe('isCronJobRunning', () => {
    it('should return false if no cron job is running', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null);

      const result = await service.isCronJobRunning(cronJobType);

      expect(findOneSpy).toHaveBeenCalledWith({
        cronJobType,
      });
      expect(result).toEqual(false);
    });

    it('should return false if last cron job is completed', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.completedAt = new Date();

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(cronJobEntity);

      const result = await service.isCronJobRunning(cronJobType);

      expect(findOneSpy).toHaveBeenCalledWith({
        cronJobType,
      });
      expect(result).toEqual(false);
    });

    it('should return true if last cron job is not completed', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(cronJobEntity);

      const result = await service.isCronJobRunning(cronJobType);
      expect(findOneSpy).toHaveBeenCalledWith({
        cronJobType,
      });
      expect(result).toEqual(true);
    });
  });

  describe('completeCronJob', () => {
    it('should complete a cron job', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;

      const mockDate = new Date(2023, 12, 23);

      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const saveSpy = jest
        .spyOn(cronJobEntity, 'save')
        .mockResolvedValue(cronJobEntity);

      const result = await service.completeCronJob(cronJobEntity);

      expect(saveSpy).toHaveBeenCalled();
      expect(cronJobEntity.completedAt).toEqual(mockDate);
      expect(result).toEqual(cronJobEntity);

      jest.useRealTimers();
    });

    it('should throw an error if cron job is already completed', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.completedAt = new Date();

      const saveSpy = jest
        .spyOn(cronJobEntity, 'save')
        .mockResolvedValue(cronJobEntity);

      await expect(service.completeCronJob(cronJobEntity)).rejects.toThrow();
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });
});
