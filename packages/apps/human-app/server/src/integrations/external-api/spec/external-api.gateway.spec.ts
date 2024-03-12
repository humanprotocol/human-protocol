import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ExternalApiGateway } from '../external-api.gateway';
import {
  oracleStatsCommandFixture,
  statisticsOracleUrl,
  userStatsCommandFixture,
  userStatsOptionsFixture, userStatsResponseFixture,
} from '../../../modules/statistics/spec/statistics.fixtures';
import { AxiosRequestConfig } from 'axios';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import nock from 'nock';
import { of } from 'rxjs';
import {
  jobAssignmentOracleUrl, jobAssignmentToken,
  jobsFetchParamsCommandFixture, jobsFetchParamsDataAsString,
} from '../../../modules/job-assignment/spec/job-assignment.fixtures';

describe('ExternalApiGateway', () => {
  let gateway: ExternalApiGateway;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
        ExternalApiGateway,
        {
          provide: HttpService,
          useValue: {
            request: jest.fn().mockReturnValue(of({ data: 'mocked response' })),
          },
        },
      ],
    })
      .compile();

    gateway = module.get<ExternalApiGateway>(ExternalApiGateway);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('fetchUserStatistics', () => {
    it('should successfully call the requested url for user statistics', async () => {
      const command = userStatsCommandFixture;
      nock(statisticsOracleUrl)
        .get('/stats/assignment')
        .matchHeader('Authorization', `Bearer ${command.token}`)
        .reply(200);
      await gateway.fetchUserStatistics(command);
      expect(httpService.request).toHaveBeenCalled();
    });
  });
  describe('fetchOracleStatistics', () => {
    it('should successfully call the requested url for oracle statistics', async () => {
      const command = oracleStatsCommandFixture;
      nock(statisticsOracleUrl)
        .get('/stats')
        .reply(200);
      await gateway.fetchOracleStatistics(command);
      expect(httpService.request).toHaveBeenCalled();
    });
  });
  describe('fetchAssignedJobs', () => {
    it('should successfully call the requested url for oracle statistics', async () => {
      const command = jobsFetchParamsCommandFixture;
      nock(jobAssignmentOracleUrl)
        .get(`/assignment${jobsFetchParamsDataAsString}`, )
        .reply(200);
      await gateway.fetchAssignedJobs(command);
      expect(httpService.request).toHaveBeenCalled();
    });
  })

  afterEach(() => {
    nock.cleanAll();
  });
});
