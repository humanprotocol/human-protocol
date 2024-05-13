import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ExchangeOracleGateway } from '../exchange-oracle.gateway';
import {
  oracleStatsDetailsFixture,
  statisticsExchangeOracleUrl,
  userStatsDetailsFixture,
} from '../../../modules/statistics/spec/statistics.fixtures';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import nock, { RequestBodyMatcher } from 'nock';
import { of, throwError } from 'rxjs';
import {
  jobAssignmentDataFixture,
  jobAssignmentDetailsFixture,
  jobAssignmentOracleUrl,
  jobsFetchParamsDataFixtureAsString,
  jobsFetchParamsDetailsFixture,
} from '../../../modules/job-assignment/spec/job-assignment.fixtures';
import { ExchangeOracleProfile } from '../exchange-oracle.mapper';
import {
  jobsDiscoveryParamsDetailsFixture,
  paramsDataFixtureAsString,
} from '../../../modules/jobs-discovery/spec/jobs-discovery.fixtures';
import { GoneException, HttpException } from '@nestjs/common';
import { UserStatisticsDetails } from '../../../modules/statistics/model/user-statistics.model';
import { HttpMethod } from '../../../common/enums/http-method';

describe('ExchangeOracleApiGateway', () => {
  let gateway: ExchangeOracleGateway;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
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

    gateway = module.get<ExchangeOracleGateway>(ExchangeOracleGateway);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
    expect(httpService).toBeDefined();
  });

  describe('fetchUserStatistics', () => {
    it('should successfully call the requested url for user statistics', async () => {
      const details = userStatsDetailsFixture;
      nock(statisticsExchangeOracleUrl)
        .get('/stats/assignment')
        .matchHeader('Authorization', `Bearer ${details.token}`)
        .reply(200);
      await gateway.fetchUserStatistics(details);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: details.exchangeOracleUrl + '/stats/assignment',
          method: HttpMethod.GET,
        }),
      );
    });
    it('should handle errors on fetchUserStatistics', async () => {
      const details = {
        exchangeOracleUrl: 'https://example.com',
        token: 'dummyToken',
      } as UserStatisticsDetails;
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(
          throwError(() => new HttpException('Service Unavailable', 503)),
        );

      await expect(gateway.fetchUserStatistics(details)).rejects.toThrow(
        HttpException,
      );
    });
  });
  describe('fetchOracleStatistics', () => {
    it('should successfully call the requested url for oracle statistics', async () => {
      const details = oracleStatsDetailsFixture;
      nock(statisticsExchangeOracleUrl).get('/stats').reply(200);
      await gateway.fetchOracleStatistics(details);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: details.exchangeOracleUrl + '/stats',
          method: HttpMethod.GET,
        }),
      );
    });
    it('should handle errors on fetchOracleStatistics', async () => {
      const details = {
        exchangeOracleUrl: 'https://example.com',
        token: 'dummyToken',
      } as UserStatisticsDetails;
      jest
        .spyOn(httpService, 'request')
        .mockReturnValue(throwError(() => new GoneException()));

      await expect(gateway.fetchUserStatistics(details)).rejects.toThrow(
        GoneException,
      );
    });
  });
  describe('fetchAssignedJobs', () => {
    it('should successfully call get assigned jobs', async () => {
      const details = jobsFetchParamsDetailsFixture;
      nock(jobAssignmentOracleUrl)
        .get(`/assignment${jobsFetchParamsDataFixtureAsString}`)
        .reply(200);
      await gateway.fetchAssignedJobs(details);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: details.exchangeOracleUrl + '/assignment',
          method: HttpMethod.GET,
        }),
      );
    });
  });
  describe('postNewJobAssignment', () => {
    it('should successfully post new job assignment', async () => {
      const details = jobAssignmentDetailsFixture;
      const data = jobAssignmentDataFixture;
      const matcher: RequestBodyMatcher = {
        escrowAddress: data.escrow_address,
        chainId: data.chain_id,
      };
      nock(jobAssignmentOracleUrl).post('/assignment', matcher).reply(200);
      await gateway.postNewJobAssignment(details);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: details.exchangeOracleUrl + '/assignment',
          method: HttpMethod.POST,
        }),
      );
    });
  });

  describe('fetchDiscoveredJobs', () => {
    it('should successfully call get discovered jobs', async () => {
      const details = jobsDiscoveryParamsDetailsFixture;
      nock(jobAssignmentOracleUrl)
        .get(`/assignment${paramsDataFixtureAsString}`)
        .reply(200);
      await gateway.fetchJobs(details);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: details.exchangeOracleUrl + '/job',
          method: HttpMethod.GET,
        }),
      );
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });
});
