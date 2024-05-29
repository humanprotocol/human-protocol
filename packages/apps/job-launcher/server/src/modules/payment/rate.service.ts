import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ServerConfigService } from '../../common/config/server-config.service';
import { COINGECKO_API_URL } from '../../common/constants';
import { ErrorCurrency } from '../../common/constants/errors';
import {
  //   CoinMarketCupTokenId,
  CoingeckoTokenId,
} from '../../common/constants/payment';
import { TokenId } from '../../common/enums/payment';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class RateService {
  private cache: Map<string, { rate: number; timestamp: number }>;

  constructor(
    private httpService: HttpService,
    private serverConfigService: ServerConfigService,
  ) {
    this.cache = new Map();
  }

  private isCacheValid(timestamp: number): boolean {
    return (
      Date.now() - timestamp < this.serverConfigService.rateCacheTime * 1000
    );
  }

  async getRate(from: string, to: string): Promise<number> {
    if (from === to) {
      return 1;
    }

    let reversed = false;
    let coingeckoFrom = from;
    let coingeckoTo = to;

    if (Object.values(TokenId).includes(to as TokenId)) {
      coingeckoFrom = CoingeckoTokenId[to];
      coingeckoTo = from;
      reversed = true;
    } else {
      coingeckoFrom = CoingeckoTokenId[from];
      coingeckoTo = to;
    }

    const cacheKey = `${from}_${to}`;
    const cachedRate = this.cache.get(cacheKey);
    if (cachedRate && this.isCacheValid(cachedRate.timestamp)) {
      return cachedRate.rate;
    }

    try {
      const authHeader = this.serverConfigService.coingeckoApiKey
        ? {
            headers: {
              'x-cg-demo-api-key': this.serverConfigService.coingeckoApiKey,
            },
          }
        : undefined;
      const { data } = (await firstValueFrom(
        this.httpService.get(
          `${COINGECKO_API_URL}?ids=${coingeckoFrom}&vs_currencies=${coingeckoTo}`,
          authHeader,
        ),
      )) as any;

      if (!data[coingeckoFrom] || !data[coingeckoFrom][coingeckoTo]) {
        throw new ControlledError(
          ErrorCurrency.PairNotFound,
          HttpStatus.NOT_FOUND,
        );
      }
      const rate = data[coingeckoFrom][coingeckoTo];
      const finalRate = reversed ? 1 / rate : rate;

      this.cache.set(cacheKey, { rate: finalRate, timestamp: Date.now() });

      return finalRate;
    } catch (error) {
      //   try {
      //     const coinMarketCapFrom = CoinMarketCupTokenId[from];
      //     const coinMarketCapTo = to;
      //     const { data } = (await firstValueFrom(
      //       this.httpService.get(
      //         `${COINMARKETCAP_API_URL}?symbol=${coinMarketCapFrom}`,
      //         {
      //           headers: {
      //             'X-CMC_PRO_API_KEY':
      //               this.serverConfigService.coinmarketcapApiKey,
      //           },
      //         },
      //       ),
      //     )) as any;
      //     if (
      //       !data.data[coinMarketCapFrom] ||
      //       !data.data[coinMarketCapFrom].quote[coinMarketCapTo]
      //     ) {
      //       throw new ControlledError(
      //         ErrorCurrency.PairNotFound,
      //         HttpStatus.NOT_FOUND,
      //       );
      //     }
      //     const rate = data.data[coinMarketCapFrom].quote[coinMarketCapTo].price;
      //     const finalRate = reversed ? 1 / rate : rate;
      //     this.cache.set(cacheKey, { rate: finalRate, timestamp: Date.now() });
      //     return finalRate;
      //   } catch (cmcError) {
      throw new ControlledError(
        ErrorCurrency.PairNotFound,
        HttpStatus.NOT_FOUND,
      );
      //   }
    }
  }
}
