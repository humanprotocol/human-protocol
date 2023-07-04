import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { COINGECKO_API_URL } from '../../common/constants';
import { Currency, TokenId } from '../../common/enums/payment';
import { ErrorCurrency } from '../../common/constants/errors';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(HttpService.name);
  constructor(private readonly httpService: HttpService) {}

  public async getRate(tokenId: TokenId, currency: Currency): Promise<number> {
    try {
      const { data } = await firstValueFrom(
        await this.httpService.get(
          `${COINGECKO_API_URL}?ids=${tokenId}&vs_currencies=${currency}`,
        ),
      );

      if (!data[tokenId] || !data[tokenId][currency]) {
        throw new NotFoundException(ErrorCurrency.PairNotFound);
      }

      return data[tokenId][currency];
    } catch (e) {
      this.logger.error(e);
      throw new Error(e);
    }
  }
}
