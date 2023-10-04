import { BadRequestException } from '@nestjs/common';
import * as Minio from 'minio';
import { ISolution } from '../interfaces/job';
import { StorageClient } from '@human-protocol/sdk';

export async function downloadJobSolutions(url: string): Promise<ISolution[]> {
  try {
    return await StorageClient.downloadFileFromUrl(url);
  } catch {
    return [];
  }
}

export async function uploadJobSolutions(
  client: Minio.Client,
  bucket: string,
  key: string,
  solutions: ISolution[],
): Promise<boolean> {
  if (!(await client.bucketExists(bucket))) {
    throw new BadRequestException('Bucket not found');
  }

  const content = JSON.stringify(solutions);

  try {
    await client.putObject(bucket, key, content, {
      'Content-Type': 'application/json',
    });

    return true;
  } catch (e) {
    throw new BadRequestException('File not uploaded');
  }
}
