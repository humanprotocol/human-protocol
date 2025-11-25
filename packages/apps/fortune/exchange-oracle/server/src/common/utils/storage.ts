import axios from 'axios';
import { HttpStatus } from '@nestjs/common';

export const isValidUrl = (maybeUrl: string): boolean => {
  try {
    const { protocol } = new URL(maybeUrl);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

export async function downloadFileFromUrl(url: string): Promise<any> {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL string');
  }

  try {
    const { data, status } = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (status !== HttpStatus.OK) {
      throw new Error('Storage file not found');
    }

    return data;
  } catch {
    throw new Error('Storage file not found');
  }
}
