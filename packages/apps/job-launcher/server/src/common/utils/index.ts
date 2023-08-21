import { firstValueFrom } from "rxjs";
import { CoingeckoTokenId } from "../constants/payment";
import { TokenId } from "../enums/payment";
import { COINGECKO_API_URL } from "../constants";
import { NotFoundException } from "@nestjs/common";
import { ErrorCurrency } from "../constants/errors";
import { HttpService } from "@nestjs/axios";

export async function getRate(from: string, to: string): Promise<number> {
  let reversed = false;

  if (Object.values(TokenId).includes(to as TokenId)) {
    [from, to] = [CoingeckoTokenId[to], from];
  } else {
    reversed = true;
  }

  const httpService = new HttpService()
    const { data } = await firstValueFrom(
      httpService.get(
        `${COINGECKO_API_URL}?ids=${from}&vs_currencies=${to}`,
      ),
    ) as any;

  if (!data[from] || !data[from][to]) {
    throw new NotFoundException(ErrorCurrency.PairNotFound);
  }

  const rate = data[from][to];

  return reversed ? 1 / rate : rate;
}