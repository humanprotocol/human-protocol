import { BadRequestException, HttpStatus } from '@nestjs/common';
import { StorageDataDto } from '../../modules/job/job.dto';
import { AWSRegions, StorageProviders } from '../enums/storage';
import { ErrorBucket } from '../constants/errors';
import { JobRequestType } from '../enums/job';
import axios from 'axios';
import { parseString } from 'xml2js';

export function generateBucketUrl(
  storageData: StorageDataDto,
  jobType: JobRequestType,
): URL {
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
      return new URL(
        `https://${storageData.bucketName}.s3.${
          storageData.region
        }.amazonaws.com${
          storageData.path ? `/${storageData.path.replace(/\/$/, '')}` : ''
        }`,
      );
    case StorageProviders.GCS:
      return new URL(
        `https://${storageData.bucketName}.storage.googleapis.com${
          storageData.path ? `/${storageData.path}` : ''
        }`,
      );
    default:
      throw new BadRequestException(ErrorBucket.InvalidProvider);
  }
}

function isRegion(value: string): value is AWSRegions {
  return Object.values(AWSRegions).includes(value as AWSRegions);
}

export async function listObjectsInBucket(url: URL): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    try {
      let objects: string[] = [];
      let nextContinuationToken: string | undefined;
      const baseUrl = `${url.protocol}//${url.host}`;
      do {
        const response = await axios.get(
          `${baseUrl}?list-type=2${
            nextContinuationToken
              ? `&continuation-token=${encodeURIComponent(
                  nextContinuationToken,
                )}`
              : ''
          }${url.pathname ? `&prefix=${url.pathname.replace(/^\//, '')}` : ''}`,
        );

        if (response.status === HttpStatus.OK && response.data) {
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
