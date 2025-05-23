import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { mockConfig } from '../../../test/constants';
import { ServerConfigService } from '../../common/config/server-config.service';
import { ErrorCurrency } from '../../common/constants/errors';
import { NotFoundError } from '../../common/errors';
import { RateService } from './rate.service';

describe('RateService', () => {
  let service: RateService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              return mockConfig[key];
            }),
          },
        },
        RateService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        ServerConfigService,
      ],
    }).compile();

    service = module.get<RateService>(RateService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should return 1 when from and to are the same', async () => {
    const rate = await service.getRate('hmt', 'hmt');
    expect(rate).toBe(1);
  });

  it('should return the rate from cache if valid', async () => {
    const from = 'hmt';
    const to = 'usd';
    const rate = 50000;
    service['cache'].set(`${from}_${to}`, { rate, timestamp: Date.now() });

    const cachedRate = await service.getRate(from, to);
    expect(cachedRate).toBe(rate);
  });

  it('should fetch rate from Coingecko when not in cache', async () => {
    const from = 'hmt';
    const to = 'usd';
    const rate = 50000;

    jest.spyOn(httpService, 'get').mockImplementation(
      () =>
        of({
          data: {
            'human-protocol': {
              usd: rate,
            },
          },
        }) as any,
    );

    const fetchedRate = await service.getRate(from, to);
    expect(fetchedRate).toBe(rate);
  });

  it('should throw an error if rate not found on Coingecko', async () => {
    const from = 'hmt';
    const to = 'usd';

    jest.spyOn(httpService, 'get').mockImplementation(
      () =>
        of({
          data: {},
        }) as any,
    );

    await expect(service.getRate(from, to)).rejects.toThrow(
      new NotFoundError(ErrorCurrency.PairNotFound),
    );
  });
});
