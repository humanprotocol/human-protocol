import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { RateService } from './rate.service';
import { ControlledError } from '../../common/errors/controlled';
import { ErrorCurrency } from '../../common/constants/errors';
import { ServerConfigService } from '../../common/config/server-config.service';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('RateService', () => {
  let service: RateService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        ServerConfigService,
        ConfigService,
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

    await expect(service.getRate(from, to)).rejects.toThrowError(
      new ControlledError(ErrorCurrency.PairNotFound, HttpStatus.NOT_FOUND),
    );
  });

  /*
  it('should fetch rate from CoinMarketCap when Coingecko fails', async () => {
    const from = 'hmt';
    const to = 'usd';
    const rate = 50000;

    jest.spyOn(httpService, 'get')
      .mockImplementationOnce(() => { throw new Error(); }) // Coingecko fails
      .mockImplementationOnce(() =>
        of({
          data: {
            hmt: {
              quote: {
                usd: {
                  price: rate,
                },
              },
            },
          },
        }) as any,
      );

    const fetchedRate = await service.getRate(from, to);
    expect(fetchedRate).toBe(rate);
  });
  */

  it('should throw an error if rate not found on both Coingecko and CoinMarketCap', async () => {
    const from = 'hmt';
    const to = 'usd';

    jest
      .spyOn(httpService, 'get')
      .mockImplementationOnce(() => {
        throw new Error();
      }) // Coingecko fails
      .mockImplementationOnce(() => {
        throw new Error();
      }); // CoinMarketCap fails

    await expect(service.getRate(from, to)).rejects.toThrowError(
      new ControlledError(ErrorCurrency.PairNotFound, HttpStatus.NOT_FOUND),
    );
  });
});
