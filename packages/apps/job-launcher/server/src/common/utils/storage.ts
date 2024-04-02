import { BadRequestException } from '@nestjs/common';
import { StorageDataDto } from '../../modules/job/job.dto';
import { AWSRegions, StorageProviders } from '../enums/storage';
import { ErrorBucket } from '../constants/errors';
import { JobRequestType } from '../enums/job';
import axios from 'axios';
import { parseString } from 'xml2js';

export function generateBucketUrl(
  storageData: StorageDataDto,
  jobType: JobRequestType,
  addPath = true,
): string {
  if (
    (jobType === JobRequestType.IMAGE_BOXES ||
      jobType === JobRequestType.IMAGE_POINTS ||
      jobType === JobRequestType.IMAGE_BOXES_FROM_POINTS ||
      jobType === JobRequestType.IMAGE_SKELETONS_FROM_BOXES) &&
    storageData.provider != StorageProviders.AWS
  ) {
    throw new BadRequestException(ErrorBucket.InvalidProvider);
  }
  if (!storageData.bucketName) {
    throw new BadRequestException(ErrorBucket.EmptyBucket);
  }
  switch (storageData.provider) {
    case StorageProviders.AWS:
      if (!storageData.region) {
        throw new BadRequestException(ErrorBucket.EmptyRegion);
      }
      if (!isRegion(storageData.region)) {
        throw new BadRequestException(ErrorBucket.InvalidRegion);
      }
      return `https://${storageData.bucketName}.s3.${
        storageData.region
      }.amazonaws.com${
        storageData.path && addPath
          ? `/${storageData.path.replace(/\/$/, '')}`
          : ''
      }`;
    case StorageProviders.GCS:
      return `https://${storageData.bucketName}.storage.googleapis.com${
        storageData.path && addPath ? `/${storageData.path}` : ''
      }`;
    default:
      throw new BadRequestException(ErrorBucket.InvalidProvider);
  }
}

function isRegion(value: string): value is AWSRegions {
  return Object.values(AWSRegions).includes(value as AWSRegions);
}

export async function listObjectsInBucket(
  storageData: StorageDataDto,
  jobType: JobRequestType,
): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    try {
      let objects: string[] = [];
      const url = generateBucketUrl(storageData, jobType, false);
      let nextContinuationToken: string | undefined;

      do {
        const response = await axios.get(
          `${url}?list-type=2${
            nextContinuationToken
              ? `&continuation-token=${encodeURIComponent(
                  nextContinuationToken,
                )}`
              : ''
          }${storageData.path ? `&prefix=${storageData.path}` : ''}`,
        );

        if (response.status === 200 && response.data) {
          parseString(response.data, (err: any, result: any) => {
            if (err) {
              reject(err);
            }
            nextContinuationToken = result.ListBucketResult
              .NextContinuationToken
              ? result.ListBucketResult.NextContinuationToken[0]
              : undefined;

            const objectKeys = result.ListBucketResult.Contents?.map(
              (item: any) => item.Key,
            );

            objects = objects.concat(objectKeys?.flat());
          });
        } else {
          reject(ErrorBucket.FailedToFetchBucketContents);
        }
      } while (nextContinuationToken);
      resolve(objects);
    } catch (err) {
      reject(err);
    }
  });
}
