import { firstValueFrom } from 'rxjs';
import { CoingeckoTokenId } from '../constants/payment';
import { TokenId } from '../enums/payment';
import { COINGECKO_API_URL } from '../constants';
import { NotFoundException } from '@nestjs/common';
import { ErrorCurrency } from '../constants/errors';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import { Readable } from 'stream';

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
  endPoint: string;
  bucket: string;
  region: string;
  useSSL: boolean;
  filename?: string;
  extension?: string;
  port?: number;
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
      regex: /^https:\/\/s3\.([a-z0-9-]+)\.amazonaws\.com\/([^/]+)\/?$/,
      endPoint: 's3.amazonaws.com',
    },
    {
      regex: /^https:\/\/([^\.]+)\.s3\.([a-z0-9-]+)\.amazonaws\.com\/?$/,
      endPoint: 's3.amazonaws.com',
    },
    {
      regex: /^https?:\/\/([^/:]+)(?::(\d+))?(\/.*)?/,
      endPoint: '$1',
      port: '$2',
    },
  ];

  for (const { regex, endPoint, port } of patterns) {
    let match = url.match(regex);

    if (match) {
      const [, param1, param2, path] = match;
      const parts = path ? path.split('/').filter((part) => part) : [];
      const bucket =
        parts[0] || (patterns[2].regex === regex ? param2 : param1);
      const filename = parts.length > 1 ? parts[parts.length - 1] : undefined;

      const data = {
        useSSL: url.startsWith('https:'),
        endPoint: endPoint.replace('$1', param1),
        region: '',
        port: port && param2 ? Number(param2) || undefined : undefined,
        bucket,
        filename: '',
        extension: '',
      };

      if (regex === patterns[2].regex) {
        data.region = param1;
      } else if (regex === patterns[3].regex) {
        data.region = param2;
      }

      if (filename) {
        match = filename.match(/([^\/]+)\.([^.\/]+)$/);
        if (match && match.length > 1) {
          data.filename = match[1];
          data.extension = match[2];
        }
      }

      return data;
    }
  }

  throw new Error('Invalid URL');
};

export function hashStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1');

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}

export function hashString(data: string): string {
  return crypto.createHash('sha1').update(data).digest('hex');
}

export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

export function isPGPMessage(str: string): boolean {
  const pattern =
    /-----BEGIN PGP MESSAGE-----\n\n[\s\S]+?\n-----END PGP MESSAGE-----/;
  return pattern.test(str);
}
