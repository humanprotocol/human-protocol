import { HttpStatus } from '@nestjs/common';
import { StorageDataDto } from '../../modules/job/job.dto';
import { AWSRegions, StorageProviders } from '../enums/storage';
import { ErrorBucket } from '../constants/errors';
import { JobRequestType } from '../enums/job';
import axios from 'axios';
import { parseString } from 'xml2js';
import { ControlledError } from '../errors/controlled';

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
    throw new ControlledError(
      ErrorBucket.InvalidProvider,
      HttpStatus.BAD_REQUEST,
    );
  }
  if (!storageData.bucketName) {
    throw new ControlledError(ErrorBucket.EmptyBucket, HttpStatus.BAD_REQUEST);
  }
  switch (storageData.provider) {
    case StorageProviders.AWS:
      if (!storageData.region) {
        throw new ControlledError(
          ErrorBucket.EmptyRegion,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!isRegion(storageData.region)) {
        throw new ControlledError(
          ErrorBucket.InvalidRegion,
          HttpStatus.BAD_REQUEST,
        );
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
    case StorageProviders.LOCAL:
      return new URL(
        `http://${process.env.S3_ENDPOINT}:${process.env.S3_PORT}/${storageData.bucketName}`,
      );
    default:
      throw new ControlledError(
        ErrorBucket.InvalidProvider,
        HttpStatus.BAD_REQUEST,
      );
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
        let requestOptions = `${baseUrl}`;

        if (url.hostname !== 'localhost') {
          requestOptions += `?list-type=2${
            nextContinuationToken
              ? `&continuation-token=${encodeURIComponent(
                  nextContinuationToken,
                )}`
              : ''
          }${url.pathname ? `&prefix=${url.pathname}` : ''}`;
        } else {
          requestOptions += `${url.pathname ? `${url.pathname}` : ''}?list-type=2${
            nextContinuationToken
              ? `&continuation-token=${encodeURIComponent(
                  nextContinuationToken,
                )}`
              : ''
          }`;
        }

        const response = await axios.get(requestOptions);

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
