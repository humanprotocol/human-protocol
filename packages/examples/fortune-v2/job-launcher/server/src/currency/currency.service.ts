import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

@Injectable()
export class CurrencyService {
  constructor(private readonly httpService: HttpService) {}

  public async getHMTPrice(amount: number, currency: string) {
    const { data } = await firstValueFrom(
      await this.httpService.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=human-protocol&vs_currencies=${currency}`,
      ),
    );
    return amount / data["human-protocol"][currency];
  }
}
