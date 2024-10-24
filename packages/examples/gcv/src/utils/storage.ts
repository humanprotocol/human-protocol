import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { parseString } from 'xml2js';
import { AWSRegions, StorageProviders } from '../enums/storage';
import { StorageDataDto } from '../dto/storage';
import { ErrorBucket } from '../constants/errors';

export function generateBucketUrl(storageData: StorageDataDto): URL {
  if (
    storageData.provider != StorageProviders.AWS &&
    storageData.provider != StorageProviders.GCS &&
    storageData.provider != StorageProviders.LOCAL
  ) {
    throw new Error(ErrorBucket.InvalidProvider);
  }
  if (!storageData.bucketName) {
    throw new Error(ErrorBucket.EmptyBucket);
  }
  switch (storageData.provider) {
    case StorageProviders.AWS:
      if (!storageData.region) {
        throw new Error(ErrorBucket.EmptyRegion);
      }
      if (!isRegion(storageData.region)) {
        throw new Error(ErrorBucket.InvalidRegion);
      }
      return new URL(
        `https://${storageData.bucketName}.s3.${
          storageData.region
        }.amazonaws.com${
          storageData.path ? `/${storageData.path.replace(/\/$/, '')}` : ''
        }`
      );
    case StorageProviders.GCS:
      return new URL(
        `https://${storageData.bucketName}.storage.googleapis.com${
          storageData.path ? `/${storageData.path}` : ''
        }`
      );
    case StorageProviders.LOCAL:
      return new URL(
        `http://${process.env.S3_ENDPOINT}:${process.env.S3_PORT}/${storageData.bucketName}${
          storageData.path ? `/${storageData.path}` : ''
        }`
      );
    default:
      throw new Error(ErrorBucket.InvalidProvider);
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
      const baseUrl = `${url.protocol}//${url.host}/`;
      do {
        let requestOptions = `${baseUrl}`;

        if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
          requestOptions += `?list-type=2${
            nextContinuationToken
              ? `&continuation-token=${encodeURIComponent(
                  nextContinuationToken
                )}`
              : ''
          }${url.pathname ? `&prefix=${url.pathname.replace(/^\//, '')}` : ''}`;
        } else {
          requestOptions += `${url.pathname ? `${url.pathname.replace(/^\//, '')}` : ''}?list-type=2${
            nextContinuationToken
              ? `&continuation-token=${encodeURIComponent(
                  nextContinuationToken
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
              (item: any) => item.Key
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
