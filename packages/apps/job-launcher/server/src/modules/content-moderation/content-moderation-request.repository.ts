import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ServerConfigService } from '../../common/config/server-config.service';
import { SortDirection } from '../../common/enums/collection';
import { ContentModerationRequestStatus } from '../../common/enums/content-moderation';
import { BaseRepository } from '../../database/base.repository';
import { ContentModerationRequestEntity } from './content-moderation-request.entity';
import { QueryFailedError } from 'typeorm';
import { handleQueryFailedError } from '../../common/errors/database';

@Injectable()
export class ContentModerationRequestRepository extends BaseRepository<ContentModerationRequestEntity> {
  constructor(
    private readonly dataSource: DataSource,
    public readonly serverConfigService: ServerConfigService,
  ) {
    super(ContentModerationRequestEntity, dataSource);
  }

  /**
   * Finds all requests for a given job, ordered by createdAt desc.
   */
  public async findByJobId(
    jobId: number,
  ): Promise<ContentModerationRequestEntity[]> {
    try {
      return this.find({
        where: { job: { id: jobId } },
        order: { createdAt: SortDirection.DESC },
        relations: ['job', 'job.contentModerationRequests'],
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      }
      throw error;
    }
  }

  /**
   * Finds requests matching a jobId & status, in descending order by createdAt.
   */
  public async findByJobIdAndStatus(
    jobId: number,
    status: ContentModerationRequestStatus,
  ): Promise<ContentModerationRequestEntity[]> {
    try {
      return this.find({
        where: { job: { id: jobId }, status },
        order: { createdAt: SortDirection.DESC },
        relations: ['job', 'job.contentModerationRequests'],
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      }
      throw error;
    }
  }

  /**
   * Creates multiple new requests in one call.
   */
  public async createRequests(
    requests: ContentModerationRequestEntity[],
  ): Promise<ContentModerationRequestEntity[]> {
    try {
      return await this.save(requests);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      }
      throw error;
    }
  }

  /**
   * Updates the status of a single request.
   */
  public async updateStatus(
    request: ContentModerationRequestEntity,
    newStatus: ContentModerationRequestStatus,
  ): Promise<void> {
    try {
      request.status = newStatus;
      await this.updateOne(request);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      }
      throw error;
    }
  }
}
