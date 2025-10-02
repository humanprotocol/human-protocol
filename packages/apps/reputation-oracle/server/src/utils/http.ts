import { Readable } from 'stream';

import axios, { AxiosError } from 'axios';
import { isURL } from 'validator';

import { BaseError } from '@/common/errors/base';

export function formatAxiosError(error: AxiosError) {
  return {
    name: error.name,
    stack: error.stack,
    cause: error.cause,
    message: error.message,
  };
}

class FileDownloadError extends BaseError {
  constructor(
    readonly location: string,
    readonly detail: unknown,
  ) {
    super('Failed to download file');
  }
}

export function isValidHttpUrl(maybeUrl: string): boolean {
  return isURL(maybeUrl, {
    require_protocol: true,
    protocols: ['http', 'https'],
    require_tld: false,
  });
}

type DownloadFileOptions = {
  asStream?: boolean;
};
type DownloadedFile<T> = T extends { asStream: true } ? Readable : Buffer;
export async function downloadFile<T extends DownloadFileOptions>(
  url: string,
  options?: T,
): Promise<DownloadedFile<T>> {
  if (!isValidHttpUrl(url)) {
    throw new FileDownloadError(url, 'Invalid http url');
  }

  const shouldReturnStream = options?.asStream === true;

  try {
    const response = await axios.get<ArrayBuffer | Readable>(url, {
      responseType: shouldReturnStream ? 'stream' : 'arraybuffer',
    });

    if (shouldReturnStream) {
      return response.data as DownloadedFile<T>;
    }

    return Buffer.from(response.data as ArrayBuffer) as DownloadedFile<T>;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new FileDownloadError(url, 'File not found');
    } else if (error instanceof AxiosError) {
      throw new FileDownloadError(url, formatAxiosError(error));
    } else {
      throw error;
    }
  }
}
