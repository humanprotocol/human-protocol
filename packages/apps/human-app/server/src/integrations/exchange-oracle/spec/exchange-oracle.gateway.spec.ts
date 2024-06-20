import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ExchangeOracleGateway } from '../exchange-oracle.gateway';
import {
  statisticsExchangeOracleUrl,
  generalUserStatsCommandFixture, oracleStatsCommandFixture,
} from '../../../modules/statistics/spec/statistics.fixtures';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import nock, { RequestBodyMatcher } from 'nock';
import { of, throwError } from 'rxjs';
import {
  jobAssignmentCommandFixture,
  jobAssignmentDataFixture,
  jobAssignmentOracleUrl,
  jobsFetchParamsCommandFixture,
  jobsFetchParamsDataFixtureAsString,
} from '../../../modules/job-assignment/spec/job-assignment.fixtures';
import { ExchangeOracleProfile } from '../exchange-oracle.mapper.profile';
import {
  jobsDiscoveryParamsCommandFixture,
  paramsDataFixtureAsString,
} from '../../../modules/jobs-discovery/spec/jobs-discovery.fixtures';
import { GoneException, HttpException } from '@nestjs/common';
import { HttpMethod } from '../../../common/enums/http-method';
import { KvStoreGateway } from '../../kv-store/kv-store.gateway';
import { EscrowUtilsGateway } from '../../escrow/escrow-utils-gateway.service';

describe('ExchangeOracleApiGateway', () => {
  let gateway: ExchangeOracleGateway;
  let httpService: HttpService;
  let escrowGateway: EscrowUtilsGateway;
  const EXCHANGE_ORACLE_ADR = 'mocked:exchange_oracle:address';
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
            getExchangeOracleUrlByAddress: jest
              .fn()
              .mockReturnValue(EXCHANGE_ORACLE_ADR),
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
          url: EXCHANGE_ORACLE_ADR + '/stats/assignment',
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
          url: EXCHANGE_ORACLE_ADR + '/stats',
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
      nock(jobAssignmentOracleUrl)
        .get(`/assignment${jobsFetchParamsDataFixtureAsString}`)
        .reply(200);
      await gateway.fetchAssignedJobs(command);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: EXCHANGE_ORACLE_ADR + '/assignment',
          method: HttpMethod.GET,
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
        .mockResolvedValue(EXCHANGE_ORACLE_ADR);
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
          url: EXCHANGE_ORACLE_ADR + '/assignment',
          method: HttpMethod.POST,
        }),
      );
    });
  });

  describe('fetchDiscoveredJobs', () => {
    it('should successfully call get discovered jobs', async () => {
      const command = jobsDiscoveryParamsCommandFixture;
      nock(jobAssignmentOracleUrl)
        .get(`/assignment${paramsDataFixtureAsString}`)
        .reply(200);
      await gateway.fetchJobs(command);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: EXCHANGE_ORACLE_ADR + '/job',
          method: HttpMethod.GET,
        }),
      );
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });
});
