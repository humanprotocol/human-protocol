import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { decode } from 'jsonwebtoken';
import { EscrowUtilsGateway } from '../../integrations/escrow/escrow-utils-gateway.service';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
import {
  JobAssignmentCommand,
  JobAssignmentResponse,
  JobsFetchParams,
  JobsFetchParamsCommand,
  JobsFetchResponse,
  JobsFetchResponseItem,
  ResignJobCommand,
} from './model/job-assignment.model';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { paginateAndSortResults } from '../../common/utils/pagination.utils';
import { JOB_ASSIGNMENT_CACHE_KEY } from '../../common/constants/cache';

@Injectable()
export class JobAssignmentService {
  constructor(
    private readonly configService: EnvironmentConfigService,
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
    private readonly escrowUtilsGateway: EscrowUtilsGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getEvmAddressFromToken(token: string): string {
    const decoded: any = decode(token.substring(7));
    return decoded.wallet_address;
  }

  private makeJobAssignmentCacheKey(
    userWalledAddress: string,
    oracleAddress: string,
  ): string {
    return `${JOB_ASSIGNMENT_CACHE_KEY}:${userWalledAddress}:${oracleAddress}`;
  }

  private getCacheRetentionDate(): string {
    const ttlMs = this.configService.cacheTtlJobAssignments * 1000;

    return new Date(Date.now() - ttlMs).toISOString();
  }

  async processJobAssignment(
    command: JobAssignmentCommand,
  ): Promise<JobAssignmentResponse> {
    const response =
      await this.exchangeOracleGateway.postNewJobAssignment(command);
    const assignmentsParamsCommand = new JobsFetchParamsCommand();
    assignmentsParamsCommand.oracleAddress =
      await this.escrowUtilsGateway.getExchangeOracleAddressByEscrowAddress(
        command.data.chainId,
        command.data.escrowAddress,
      );
    assignmentsParamsCommand.token = command.token;

    this.updateAssignmentsCache(assignmentsParamsCommand);

    return response;
  }

  async resignJob(command: ResignJobCommand) {
    const response =
      await this.exchangeOracleGateway.resignAssignedJob(command);

    const assignmentsParamsCommand = new JobsFetchParamsCommand();
    assignmentsParamsCommand.oracleAddress = command.oracleAddress;
    assignmentsParamsCommand.token = command.token;

    await this.updateAssignmentsCache(assignmentsParamsCommand);

    return response;
  }

  async processGetAssignedJobs(
    command: JobsFetchParamsCommand,
  ): Promise<JobsFetchResponse> {
    const evmAddress = this.getEvmAddressFromToken(command.token);
    const cacheKey = this.makeJobAssignmentCacheKey(
      evmAddress,
      command.oracleAddress,
    );

    const cachedData =
      await this.cacheManager.get<JobsFetchResponseItem[]>(cacheKey);
    if (cachedData && cachedData.length > 0) {
      return paginateAndSortResults(
        this.applyFilters(cachedData, command.data),
        command.data.page,
        command.data.pageSize,
        command.data.sortField as keyof JobsFetchResponseItem,
        command.data.sort,
      );
    }

    command.data.updatedAfter = this.getCacheRetentionDate();
    const allJobsData = await this.fetchAllAssignedJobs(command);
    await this.cacheManager.set(cacheKey, allJobsData);
    return paginateAndSortResults(
      this.applyFilters(allJobsData, command.data),
      command.data.page,
      command.data.pageSize,
      command.data.sortField as keyof JobsFetchResponseItem,
      command.data.sort,
    );
  }

  private applyFilters(
    assignments: JobsFetchResponseItem[],
    { chainId, jobType, status, escrowAddress }: JobsFetchParamsCommand['data'],
  ): JobsFetchResponseItem[] {
    return assignments.filter((assignment) => {
      if (chainId && assignment.chain_id !== chainId) {
        return false;
      }

      if (status && assignment.status !== status) {
        return false;
      }

      if (escrowAddress && assignment.escrow_address !== escrowAddress) {
        return false;
      }

      if (jobType && assignment.job_type !== jobType) {
        return false;
      }

      return true;
    });
  }

  public async updateAssignmentsCache(
    command: JobsFetchParamsCommand,
  ): Promise<void> {
    const evmAddress = this.getEvmAddressFromToken(command.token);
    const cacheRetentionDate = this.getCacheRetentionDate();
    const cacheKey = this.makeJobAssignmentCacheKey(
      evmAddress,
      command.oracleAddress,
    );

    const cachedAssignments =
      (await this.cacheManager.get<JobsFetchResponseItem[]>(cacheKey)) || [];

    const cachedAssignmentsToRetain = [];
    let latestUpdatedAt = cacheRetentionDate;
    for (const jobAssignment of cachedAssignments) {
      if (jobAssignment.updated_at > cacheRetentionDate) {
        cachedAssignmentsToRetain.push(jobAssignment);
      }

      if (jobAssignment.updated_at > latestUpdatedAt) {
        latestUpdatedAt = jobAssignment.updated_at;
      }
    }

    if (!command.data) command.data = new JobsFetchParams();
    command.data.updatedAfter = latestUpdatedAt;

    const fetchedAssignments = await this.fetchAllAssignedJobs(command);

    const mergedData = this.mergeAssignments(
      cachedAssignmentsToRetain,
      fetchedAssignments,
    );
    await this.cacheManager.set(cacheKey, mergedData);
  }

  private async fetchAllAssignedJobs(
    command: JobsFetchParamsCommand,
  ): Promise<JobsFetchResponseItem[]> {
    let allResults: JobsFetchResponseItem[] = [];
    const initialPage = command.data.page;
    const initialPageSize = command.data.pageSize;

    // Initial fetch to determine the total number of pages
    command.data.page = 0;
    command.data.pageSize = 10; // Max value for Exchange Oracle
    const initialResponse =
      await this.exchangeOracleGateway.fetchAssignedJobs(command);
    allResults = this.mergeAssignments(allResults, initialResponse.results);

    const totalPages = initialResponse.total_pages;

    // Fetch remaining pages
    const pageFetches = [];
    for (let i = 1; i < totalPages; i++) {
      command.data.page = i;
      pageFetches.push(this.exchangeOracleGateway.fetchAssignedJobs(command));
    }

    const remainingResponses = await Promise.all(pageFetches);
    for (const response of remainingResponses) {
      allResults = this.mergeAssignments(allResults, response.results);
    }

    command.data.page = initialPage;
    command.data.pageSize = initialPageSize;

    return allResults;
  }

  private mergeAssignments(
    cachedAssignments: JobsFetchResponseItem[],
    fetchedAssignments: JobsFetchResponseItem[],
  ): JobsFetchResponseItem[] {
    const assignmentsMap = new Map<string, JobsFetchResponseItem>();

    for (const assignment of cachedAssignments) {
      assignmentsMap.set(assignment.assignment_id, assignment);
    }

    for (const assignment of fetchedAssignments) {
      assignmentsMap.set(assignment.assignment_id, assignment);
    }

    return Array.from(assignmentsMap.values());
  }
}
