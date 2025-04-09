import axios, { AxiosError } from 'axios';
import { Readable } from 'stream';

import { BaseError } from '../common/errors/base';

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

function isValidUrl(maybeUrl: string, protocols?: string[]): boolean {
  try {
    const url = new URL(maybeUrl);

    if (protocols?.length) {
      return protocols.includes(url.protocol.replace(':', ''));
    }

    return true;
  } catch (_error) {
    return false;
  }
}

export function isValidHttpUrl(maybeUrl: string): boolean {
  return isValidUrl(maybeUrl, ['http', 'https']);
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
      throw new FileDownloadError(url, error.cause || error.message);
    }
  }
}
