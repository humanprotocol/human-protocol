import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import { Currency, TokenId } from '../../common/enums/payment';
import { COINGECKO_API_URL } from '../../common/constants';
import { ErrorCurrency } from '../../common/constants/errors';
import { of } from 'rxjs';

describe('CurrencyService', () => {
  let currencyService: CurrencyService;
  let httpService: HttpService;

  beforeAll(async () => {
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
    it('should get the rate for a given token ID and currency', async () => {
      const tokenId = TokenId.HMT;
      const currency = Currency.USD;
      const rate = 1.5;

      const response = {
        data: {
          [tokenId]: {
            [currency]: rate,
          },
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response as any));
      const result = await currencyService.getRate(tokenId, currency);

      expect(httpService.get).toHaveBeenCalledWith(
        `${COINGECKO_API_URL}?ids=${tokenId}&vs_currencies=${currency}`,
      );
      expect(result).toBe(rate);
    });

    it('should throw NotFoundException if the rate is not found', async () => {
      const tokenId = TokenId.HMT;
      const currency = Currency.USD;

      const response = {
        data: {},
      };

      jest.spyOn(httpService, 'get').mockReturnValueOnce(of(response as any));

      await expect(currencyService.getRate(tokenId, currency)).rejects.toThrow(
        ErrorCurrency.PairNotFound,
      );
    });
  });
});
