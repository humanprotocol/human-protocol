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
import { paginateAndSortResults } from '../../common/utils/pagination.utils';

@Injectable()
export class JobAssignmentService {
  constructor(
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
    private readonly escrowUtilsGateway: EscrowUtilsGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getEvmAddressFromToken(token: string): string {
    const decoded: any = decode(token.substring(7));
    return decoded.wallet_address;
  }

  async processJobAssignment(
    command: JobAssignmentCommand,
  ): Promise<JobAssignmentResponse> {
    const response =
      await this.exchangeOracleGateway.postNewJobAssignment(command);

    const evmAddress = this.getEvmAddressFromToken(command.token);
    const assignmentsParamsCommand = new JobsFetchParamsCommand();
    assignmentsParamsCommand.oracleAddress =
      await this.escrowUtilsGateway.getExchangeOracleAddressByEscrowAddress(
        command.data.chainId,
        command.data.escrowAddress,
      );
    assignmentsParamsCommand.token = command.token;

    await this.updateAssignmentsCache(assignmentsParamsCommand, evmAddress);

    return response;
  }

  async processGetAssignedJobs(
    command: JobsFetchParamsCommand,
  ): Promise<JobsFetchResponse> {
    const evmAddress = this.getEvmAddressFromToken(command.token);
    const cacheKey = `assignedJobs:${evmAddress}`;

    const cachedData =
      await this.cacheManager.get<JobsFetchResponseItem[]>(cacheKey);
    if (cachedData && cachedData.length > 0) {
      return paginateAndSortResults(
        cachedData,
        command.data.page,
        command.data.pageSize,
        command.data.sortField as keyof JobsFetchResponseItem,
        command.data.sort,
      );
    }

    const allJobsData = await this.fetchAllAssignedJobs(command);
    await this.cacheManager.set(cacheKey, allJobsData);
    return paginateAndSortResults(
      allJobsData,
      command.data.page,
      command.data.pageSize,
      command.data.sortField as keyof JobsFetchResponseItem,
      command.data.sort,
    );
  }

  private async updateAssignmentsCache(
    command: JobsFetchParamsCommand,
    evmAddress: string,
  ): Promise<void> {
    const cacheKey = `assignedJobs:${evmAddress}`;

    const cachedData =
      await this.cacheManager.get<JobsFetchResponseItem[]>(cacheKey);
    const latestUpdatedAt = cachedData?.reduce(
      (latest, assignment) => {
        if (!latest || new Date(assignment.updated_at) > new Date(latest)) {
          return assignment.updated_at;
        }
        return latest;
      },
      null as string | null | undefined,
    );

    if (!command.data) command.data = new JobsFetchParams();
    command.data.updatedAfter = latestUpdatedAt ?? undefined;

    const assignmentsData = await this.fetchAllAssignedJobs(command);

    const mergedData = this.mergeAssignments(cachedData || [], assignmentsData);
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
    newAssignments: JobsFetchResponseItem[],
  ): JobsFetchResponseItem[] {
    const assignmentsMap = new Map<string, JobsFetchResponseItem>();

    for (const assignment of cachedAssignments) {
      assignmentsMap.set(assignment.assignment_id, assignment);
    }

    for (const assignment of newAssignments) {
      assignmentsMap.set(assignment.assignment_id, assignment);
    }

    return Array.from(assignmentsMap.values());
  }

  async resignJob(command: ResignJobCommand) {
    const response =
      await this.exchangeOracleGateway.resignAssignedJob(command);

    const evmAddress = this.getEvmAddressFromToken(command.token);
    const assignmentsParamsCommand = new JobsFetchParamsCommand();
    assignmentsParamsCommand.oracleAddress = command.oracleAddress;
    assignmentsParamsCommand.token = command.token;

    await this.updateAssignmentsCache(assignmentsParamsCommand, evmAddress);

    return response;
  }
}
