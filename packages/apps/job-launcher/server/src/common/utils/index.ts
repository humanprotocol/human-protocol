import { firstValueFrom } from 'rxjs';
import { CoingeckoTokenId } from '../constants/payment';
import { TokenId } from '../enums/payment';
import { COINGECKO_API_URL } from '../constants';
import { NotFoundException } from '@nestjs/common';
import { ErrorCurrency } from '../constants/errors';
import { HttpService } from '@nestjs/axios';

export async function getRate(from: string, to: string): Promise<number> {
  if (from === to) {
    return 1;
  }
  let reversed = false;

  if (Object.values(TokenId).includes(to as TokenId)) {
    [from, to] = [CoingeckoTokenId[to], from];
    reversed = true;
  } else {
    [from, to] = [CoingeckoTokenId[from], to];
  }

  const httpService = new HttpService();
  const { data } = (await firstValueFrom(
    httpService.get(`${COINGECKO_API_URL}?ids=${from}&vs_currencies=${to}`),
  )) as any;

  if (!data[from] || !data[from][to]) {
    throw new NotFoundException(ErrorCurrency.PairNotFound);
  }

  const rate = data[from][to];

  return reversed ? 1 / rate : rate;
}

export const parseUrl = (
  url: string,
): {
  endpoint: string;
  bucket: string;
  port?: number;
} => {
  const patterns = [
    {
      regex: /^https:\/\/storage\.googleapis\.com\/([^/]+)\/?$/,
      endpoint: 'storage.googleapis.com',
    },
    {
      regex: /^https:\/\/([^\.]+)\.storage\.googleapis\.com\/?$/,
      endpoint: 'storage.googleapis.com',
    },
    {
      regex: /^https?:\/\/([^/:]+)(?::(\d+))?(\/.*)?/,
      endpoint: '$1',
      port: '$2',
    },
  ];

  for (const { regex, endpoint, port } of patterns) {
    const match = url.match(regex);
    if (match) {
      const bucket = match[3] ? match[3].split('/')[1] : '';
      return {
        endpoint: endpoint.replace('$1', match[1]),
        bucket,
        port: port ? Number(match[2]) : undefined,
      };
    }
  }

  throw new Error('Invalid URL');
};
