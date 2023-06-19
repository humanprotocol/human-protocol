import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';
import { HttpService } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Currency, TokenId } from '../../common/enums/payment';
import { COINGECKO_API_URL } from '../../common/constants';
import {
  NotFoundException,
} from '@nestjs/common';
import { ErrorCurrency } from '../../common/constants/errors';

describe.skip('CurrencyService', () => {
  let currencyService: CurrencyService;
  let httpService: DeepMocked<HttpService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: HttpService,
          useValue: createMock<HttpService>(),
        },
      ],
    }).compile();

    currencyService = module.get<CurrencyService>(CurrencyService);
    httpService = module.get(HttpService);
  });

  describe('getRate', () => {
    it('should return the rate for the given token ID and currency', async () => {
      const tokenId = TokenId.HUMAN_PROTOCOL;
      const currency = Currency.USD;

      const coingeckoResponse = {
        data: {
          [tokenId]: {
            [currency]: 1.2345,
          },
        },
      };

      jest.spyOn(httpService, 'get').mockResolvedValue(coingeckoResponse as never);

      const result = await currencyService.getRate(tokenId, currency);

      expect(httpService.get).toHaveBeenCalledWith(
        `${COINGECKO_API_URL}?ids=${tokenId}&vs_currencies=${currency}`
      );
      expect(result).toBe(1.2345);
    });

    it('should throw a not found exception if the pair is not found', async () => {
      const tokenId = TokenId.HUMAN_PROTOCOL;
      const currency = Currency.USD;

      const coingeckoResponse = {
        data: {},
      };

      jest.spyOn(httpService, 'get').mockResolvedValue(coingeckoResponse as never);

      await expect(
        currencyService.getRate(tokenId, currency)
      ).rejects.toThrowError(new NotFoundException(ErrorCurrency.PairNotFound));
    });
  });
});
