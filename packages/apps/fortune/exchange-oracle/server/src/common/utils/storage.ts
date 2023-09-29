import * as Minio from 'minio';
import { ISolution } from '../interfaces/job';
import { StorageClient } from '@human-protocol/sdk';
import { BadRequestException } from '@nestjs/common';

export async function uploadJobSolutions(
  client: Minio.Client,
  chainId: number,
  escrowAddress: string,
  workerAddress: string,
  exchangeAddress: string,
  solution: string,
  bucket: string,
): Promise<string> {
  if (!(await client.bucketExists(bucket))) {
    throw new BadRequestException('Bucket not found');
  }
  const key = `${escrowAddress}-${chainId}.json`;
  const url = `${(client as any).protocol}//${(client as any).host}:${
    (client as any).port
  }/${bucket}/${key}`;

  let existingJobSolutions: ISolution[];
  try {
    existingJobSolutions = await StorageClient.downloadFileFromUrl(url);
  } catch {
    existingJobSolutions = [];
  }

  if (
    existingJobSolutions.find(
      (solution) => solution.workerAddress === workerAddress,
    )
  ) {
    throw new BadRequestException('User has already submitted a solution');
  }

  const newJobSolutions: ISolution[] = [
    ...existingJobSolutions,
    {
      exchangeAddress: exchangeAddress,
      workerAddress: workerAddress,
      solution: solution,
    },
  ];

  const content = JSON.stringify(newJobSolutions);

  try {
    await client.putObject(bucket, key, content, {
      'Content-Type': 'application/json',
    });

    return url;
  } catch (e) {
    throw new BadRequestException('File not uploaded');
  }
}
