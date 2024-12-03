import { Injectable } from '@nestjs/common';
import { JobRepository } from '../job/job.repository';
import {
  JobStatusPerDayDto,
  JobCountDto,
  FundAmountStatisticsDto,
} from './statistic.dto';

@Injectable()
export class StatisticService {
  constructor(private readonly jobRepository: JobRepository) {}

  async getAllJobStatistics(): Promise<{
    averageCompletionTime: number;
    jobCounts: JobCountDto;
    fundAmountStats: FundAmountStatisticsDto;
    jobsByStatusPerDay: JobStatusPerDayDto[];
  }> {
    const averageCompletionTime =
      await this.jobRepository.getAverageCompletionTime();
    const fundAmountStats = await this.jobRepository.getFundAmountStats();
    const jobCounts = await this.jobRepository.getGlobalJobCounts();
    const launchedJobsPerDay = await this.jobRepository.getLaunchedJobsPerDay();
    const jobsByStatusPerDay = await this.jobRepository.getJobsByStatusPerDay();

    const combinedJobsByStatusPerDay = this.combineJobStatusesPerDay(
      launchedJobsPerDay,
      jobsByStatusPerDay,
    );

    return {
      averageCompletionTime,
      jobCounts,
      fundAmountStats,
      jobsByStatusPerDay: combinedJobsByStatusPerDay,
    };
  }

  private combineJobStatusesPerDay(
    launchedJobsPerDay: JobStatusPerDayDto[],
    jobsByStatusPerDay: JobStatusPerDayDto[],
  ): JobStatusPerDayDto[] {
    const dateMap = new Map<string, JobStatusPerDayDto>();

    launchedJobsPerDay.forEach((job) => {
      dateMap.set(job.date, {
        date: job.date,
        launched: job.launched,
        partial: 0,
        completed: 0,
        canceled: 0,
      });
    });

    jobsByStatusPerDay.forEach((job) => {
      const existing = dateMap.get(job.date);
      if (!existing) {
        dateMap.set(job.date, {
          date: job.date,
          launched: 0,
          partial: job.partial,
          completed: job.completed,
          canceled: job.canceled,
        });
      } else {
        existing.partial += job.partial;
        existing.completed += job.completed;
        existing.canceled += job.canceled;
        dateMap.set(job.date, existing);
      }
    });

    return Array.from(dateMap.values());
  }
}
