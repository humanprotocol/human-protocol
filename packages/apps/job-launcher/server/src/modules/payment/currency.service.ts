import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { COINGECKO_API_URL } from '../../common/constants';
import { ErrorCurrency } from '../../common/constants/errors';
import { Currency, TokenId } from '../../common/enums/payment';
import { CoingeckoTokenId } from '../../common/constants/payment';

@Injectable()
export class CurrencyService {
  constructor(private readonly httpService: HttpService) {}

  public async getRate(from: string, to: string): Promise<number> {
    let reversed = false;
    

    if (Object.values(TokenId).includes(to as TokenId)) {
      [from, to] = [CoingeckoTokenId[to], from]
    } else {
      reversed = true;
    }
    
    const { data } = await firstValueFrom(
      this.httpService.get(
        `${COINGECKO_API_URL}?ids=${from}&vs_currencies=${to}`,
      ),
    );
  
    if (!data[from] || !data[from][to]) {
      throw new NotFoundException(ErrorCurrency.PairNotFound);
    }
  
    const rate = data[from][to];
  
    return reversed ? 1 / rate : rate;
  }
}
