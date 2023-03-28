import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { COINGECKO_API_URL } from "../common/constants";

@Injectable()
export class CurrencyService {
  constructor(private readonly httpService: HttpService) {}

  public async getRate(token_name: string, currency: string) {
    const { data } = await firstValueFrom(
      await this.httpService.get(`${COINGECKO_API_URL}?ids=${token_name}&vs_currencies=${currency}`),
    );
    return data[token_name][currency];
  }
}
