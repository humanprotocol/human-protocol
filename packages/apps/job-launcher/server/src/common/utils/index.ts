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

export const parseUrl = (url: string): {
  endPoint: string,
  bucket: string,
  useSSL: boolean,
  filename?: string,
  port?: number,
} => {
  const patterns = [
    {
      regex: /^https:\/\/storage\.googleapis\.com\/([^/]+)\/?$/,
      endPoint: 'storage.googleapis.com',
    },
    {
      regex: /^https:\/\/([^\.]+)\.storage\.googleapis\.com\/?$/,
      endPoint: 'storage.googleapis.com',
    },
    {
      regex: /^https:\/\/s3\.[a-z0-9-]+\.amazonaws\.com\/[a-zA-Z0-9\.-]+$/,
      endPoint: 's3.amazonaws.com',
    },
    {
      regex: /^https:\/\/[a-zA-Z0-9\.-]+\.s3\.[a-z0-9-]+\.amazonaws\.com\/$/,
      endPoint: 's3.amazonaws.com',
    },
    {
      regex: /^https?:\/\/([^/:]+)(?::(\d+))?(\/.*)?/,
      endPoint: '$1',
      port: '$2',
    },
  ];

  for (const { regex, endPoint, port } of patterns) {
    const match = url.match(regex);
    if (match) {
      const parts = match[3] ? match[3].split('/').filter(part => part) : [];
      const bucket = parts[0] || '';
      const filename = parts.length > 1 ? parts[parts.length - 1] : undefined;

      return {
        useSSL: url.startsWith('https:'),
        endPoint: endPoint.replace('$1', match[1]),
        port: port && match[2] ? Number(match[2]) : undefined,
        bucket,
        filename,
      };
    }
  }

  throw new Error('Invalid URL');
};