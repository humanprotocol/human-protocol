import { BadRequestException } from '@nestjs/common';
import * as Minio from 'minio';
import { ISolution } from '../interfaces/job';
import crypto from 'crypto';
import { SaveSolutionsDto } from '@/modules/job/job.dto';

export async function uploadJobSolutions(
  client: Minio.Client,
  chainId: number,
  escrowAddress: string,
  solutions: ISolution[],
  bucket: string,
): Promise<SaveSolutionsDto> {
  if (!(await client.bucketExists(bucket))) {
    throw new BadRequestException('Bucket not found');
  }
  const key = `${escrowAddress}-${chainId}.json`;
  const url = `${(client as any).protocol}//${(client as any).host}:${
    (client as any).port
  }/${bucket}/${key}`;

  const content = JSON.stringify(solutions);

  const hash = crypto.createHash('sha1').update(content).digest('hex');

  try {
    await client.putObject(bucket, key, content, {
      'Content-Type': 'application/json',
    });

    return { url, hash };
  } catch (e) {
    throw new BadRequestException('File not uploaded');
  }
}
