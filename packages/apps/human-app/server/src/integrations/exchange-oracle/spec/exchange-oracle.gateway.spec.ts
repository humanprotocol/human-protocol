import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ExchangeOracleGateway } from '../exchange-oracle.gateway';
import {
  statisticsExchangeOracleUrl,
  generalUserStatsCommandFixture,
  oracleStatsCommandFixture,
} from '../../../modules/statistics/spec/statistics.fixtures';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import nock, { RequestBodyMatcher } from 'nock';
import { of, throwError } from 'rxjs';
import {
  jobAssignmentCommandFixture,
  jobAssignmentDataFixture,
  jobAssignmentOracleUrl,
  jobResignAssignedCommandFixture,
  jobsFetchParamsCommandFixture,
  jobsFetchParamsDataFixtureAsString,
  workerRegisterUrl,
} from '../../../modules/job-assignment/spec/job-assignment.fixtures';
import { ExchangeOracleProfile } from '../exchange-oracle.mapper.profile';
import {
  jobsDiscoveryParamsCommandFixture,
  paramsDataFixture,
  paramsDataFixtureAsString,
  responseFixture,
} from '../../../modules/jobs-discovery/spec/jobs-discovery.fixtures';
import { GoneException, HttpException } from '@nestjs/common';
import { HttpMethod } from '../../../common/enums/http-method';
import { KvStoreGateway } from '../../kv-store/kv-store.gateway';
import { EscrowUtilsGateway } from '../../escrow/escrow-utils-gateway.service';
import { ResignJobData } from '../../../modules/job-assignment/model/job-assignment.model';
import { JobsDiscoveryParamsData } from '../../../modules/jobs-discovery/model/jobs-discovery.model';
import { AxiosResponse } from 'axios';
import { RegisterWorkerData } from '../../../modules/user-worker/model/worker-registration.model';
import {
  registerWorkerCommandFixture,
  registerWorkerDataFixture,
  responseWorkerFixture,
} from '../../../modules/user-worker/spec/worker.fixtures';

describe('ExchangeOracleApiGateway', () => {
  let gateway: ExchangeOracleGateway;
  let httpService: HttpService;
  let escrowGateway: EscrowUtilsGateway;
  const EXCHANGE_ORACLE_REGISTRATION_NEEDED =
    'mocked:exchange_oracle:registration_needed';
  const EXCHANGE_ORACLE_URL = 'mocked:exchange_oracle:url';
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
        {
          provide: KvStoreGateway,
          useValue: {
            getExchangeOracleRegistrationNeeded: jest
              .fn()
              .mockReturnValue(EXCHANGE_ORACLE_REGISTRATION_NEEDED),
            getExchangeOracleUrlByAddress: jest
              .fn()
              .mockReturnValue(EXCHANGE_ORACLE_URL),
          },
        },
        {
          provide: EscrowUtilsGateway,
          useValue: {
            getExchangeOracleAddressByEscrowAddress: jest.fn(),
          },
        },
        ExchangeOracleProfile,
        ExchangeOracleGateway,
        {
          provide: HttpService,
          useValue: {
            request: jest.fn().mockReturnValue(of({ data: 'mocked response' })),
          },
        },
      ],
    }).compile();
    escrowGateway = module.get<EscrowUtilsGateway>(EscrowUtilsGateway);
    gateway = module.get<ExchangeOracleGateway>(ExchangeOracleGateway);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
    expect(httpService).toBeDefined();
  });

  describe('fetchUserStatistics', () => {
    it('should successfully call the requested url for user statistics', async () => {
      const command = generalUserStatsCommandFixture;
      nock(statisticsExchangeOracleUrl)
        .get('/stats/assignment')
        .matchHeader('Authorization', `Bearer ${command.token}`)
        .reply(200);
      await gateway.fetchUserStatistics(command);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: EXCHANGE_ORACLE_URL + '/stats/assignment',
          method: HttpMethod.GET,
        }),
      );
    });
    it('should handle errors on fetchUserStatistics', async () => {
      const command = generalUserStatsCommandFixture;
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(
          throwError(() => new HttpException('Service Unavailable', 503)),
        );

      await expect(gateway.fetchUserStatistics(command)).rejects.toThrow(
        HttpException,
      );
    });
  });
  describe('fetchOracleStatistics', () => {
    it('should successfully call the requested url for oracle statistics', async () => {
      const command = oracleStatsCommandFixture;
      nock(statisticsExchangeOracleUrl).get('/stats').reply(200);
      await gateway.fetchOracleStatistics(command);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: EXCHANGE_ORACLE_URL + '/stats',
          method: HttpMethod.GET,
        }),
      );
    });
    it('should handle errors on fetchUserStatistics', async () => {
      const command = generalUserStatsCommandFixture;
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new GoneException()));

      await expect(gateway.fetchUserStatistics(command)).rejects.toThrow(
        GoneException,
      );
    });
  });
  describe('fetchAssignedJobs', () => {
    it('should successfully call get assigned jobs', async () => {
      const command = jobsFetchParamsCommandFixture;
      const expectedMappedData = {
        page_size: command.data.pageSize,
        sort_field: command.data.sortField,
        assignment_id: command.data.assignmentId,
        chain_id: command.data.chainId,
        escrow_address: command.data.escrowAddress,
        job_type: command.data.jobType,
        page: command.data.page,
        sort: command.data.sort,
        status: command.data.status,
      };
      nock(jobAssignmentOracleUrl)
        .get(`/assignment${jobsFetchParamsDataFixtureAsString}`)
        .reply(200);
      await gateway.fetchAssignedJobs(command);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: EXCHANGE_ORACLE_URL + '/assignment',
          method: HttpMethod.GET,
          params: expectedMappedData,
          headers: {
            Authorization: command.token,
            Accept: 'application/json',
          },
        }),
      );
    });
  });
  describe('postNewJobAssignment', () => {
    it('should successfully post new job assignment', async () => {
      const command = jobAssignmentCommandFixture;
      const data = jobAssignmentDataFixture;
      jest
        .spyOn(escrowGateway, 'getExchangeOracleAddressByEscrowAddress')
        .mockResolvedValue(EXCHANGE_ORACLE_URL);
      const matcher: RequestBodyMatcher = {
        escrowAddress: data.escrow_address,
        chainId: data.chain_id,
      };
      nock(jobAssignmentOracleUrl).post('/assignment', matcher).reply(200);
      await gateway.postNewJobAssignment(command);
      expect(
        escrowGateway.getExchangeOracleAddressByEscrowAddress,
      ).toHaveBeenCalledWith(command.data.chainId, command.data.escrowAddress);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: EXCHANGE_ORACLE_URL + '/assignment',
          method: HttpMethod.POST,
        }),
      );
    });
  });

  describe('resignAssignedJob', () => {
    it('should successfully resign assigned job', async () => {
      const command = jobResignAssignedCommandFixture;
      const expectedMappedData: ResignJobData = {
        assignment_id: command.assignmentId,
      };
      nock(jobAssignmentOracleUrl).post('/assignment/resign').reply(200);
      await gateway.resignAssignedJob(command);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: EXCHANGE_ORACLE_URL + '/assignment/resign',
          method: HttpMethod.POST,
          data: expectedMappedData,
          headers: {
            Authorization: command.token,
            Accept: 'application/json',
          },
        }),
      );
    });
  });

  describe('fetchDiscoveredJobs', () => {
    it('should successfully call get discovered jobs', async () => {
      jest.spyOn(httpService, 'request').mockReturnValue(
        of({
          data: responseFixture,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        } as AxiosResponse),
      );
      const command = jobsDiscoveryParamsCommandFixture;
      const expectedMappedData: JobsDiscoveryParamsData = paramsDataFixture;
      nock(jobAssignmentOracleUrl)
        .get(`/assignment${paramsDataFixtureAsString}`)
        .reply(200, responseFixture);
      await gateway.fetchJobs(command);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: EXCHANGE_ORACLE_URL + '/job',
          method: HttpMethod.GET,
          params: expectedMappedData,
          headers: {
            Authorization: command.token,
            Accept: 'application/json',
          },
        }),
      );
    });
  });

  describe('registerWorker', () => {
    it('should successfully call register worker', async () => {
      jest.spyOn(httpService, 'request').mockReturnValue(
        of({
          data: responseWorkerFixture,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        } as AxiosResponse),
      );
      const command = registerWorkerCommandFixture;
      const expectedMappedData: RegisterWorkerData = registerWorkerDataFixture;
      nock(workerRegisterUrl)
        .post(`/register`)
        .reply(200, responseWorkerFixture);
      await gateway.registerWorker(command);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: EXCHANGE_ORACLE_URL + '/register',
          method: HttpMethod.POST,
          data: expectedMappedData,
          headers: {
            Authorization: command.token,
            Accept: 'application/json',
          },
        }),
      );
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });
});
