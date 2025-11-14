import { HttpStatus } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { parseString } from 'xml2js';
import { StorageDataDto } from '../../modules/job/job.dto';
import { ErrorBucket } from '../constants/errors';
import { AudinoJobType, CvatJobType, JobRequestType } from '../enums/job';
import { AWSRegions, StorageProviders } from '../enums/storage';
import { ValidationError } from '../errors';
import {
  GCS_HTTP_REGEX_PATH_BASED,
  GCS_HTTP_REGEX_SUBDOMAIN,
} from './gcstorage';
import { formatAxiosError } from './http';

export function generateBucketUrl(
  storageData: StorageDataDto,
  jobType: JobRequestType,
): URL {
  if (
    (
      [
        CvatJobType.IMAGE_POLYGONS,
        CvatJobType.IMAGE_BOXES,
        CvatJobType.IMAGE_POINTS,
        CvatJobType.IMAGE_BOXES_FROM_POINTS,
        CvatJobType.IMAGE_SKELETONS_FROM_BOXES,
        AudinoJobType.AUDIO_TRANSCRIPTION,
        AudinoJobType.AUDIO_ATTRIBUTE_ANNOTATION,
      ] as JobRequestType[]
    ).includes(jobType) &&
    storageData.provider != StorageProviders.AWS &&
    storageData.provider != StorageProviders.GCS &&
    storageData.provider != StorageProviders.LOCAL
  ) {
    throw new ValidationError(ErrorBucket.InvalidProvider);
  }
  if (!storageData.bucketName) {
    throw new ValidationError(ErrorBucket.EmptyBucket);
  }

  switch (storageData.provider) {
    case StorageProviders.AWS:
      if (!storageData.region) {
        throw new ValidationError(ErrorBucket.EmptyRegion);
      }
      if (!isRegion(storageData.region)) {
        throw new ValidationError(ErrorBucket.InvalidRegion);
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
        `http://${process.env.S3_ENDPOINT}:${process.env.S3_PORT}/${storageData.bucketName}${
          storageData.path ? `/${storageData.path}` : ''
        }`,
      );
    default:
      throw new ValidationError(ErrorBucket.InvalidProvider);
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
        let requestUrl = `${baseUrl}`;
        if (['localhost', 'minio'].includes(url.hostname)) {
          const pathname = url.pathname.replace(/^\//, '');
          const [bucketName, ...folderParts] = pathname.split('/');

          requestUrl += `/${bucketName}?list-type=2`;

          const folderPrefix = folderParts.join('/');
          if (folderPrefix) {
            requestUrl += `&prefix=${folderPrefix}`;
          }
        } else if (GCS_HTTP_REGEX_SUBDOMAIN.test(url.href)) {
          requestUrl += `?list-type=2&prefix=${url.pathname.replace(/^\//, '')}`;
        } else if (GCS_HTTP_REGEX_PATH_BASED.test(url.href)) {
          const pathname = url.pathname.replace(/^\//, '');
          const [bucketName, ...folderParts] = pathname.split('/');
          requestUrl += `/${bucketName}?list-type=2`;

          const folderPrefix = folderParts.join('/');
          if (folderPrefix) {
            requestUrl += `&prefix=${folderPrefix}`;
          }
        } else {
          requestUrl += `?list-type=2`;

          if (url.pathname) {
            requestUrl += `&prefix=${url.pathname.replace(/^\//, '')}`;
          }
        }

        if (nextContinuationToken) {
          requestUrl += `&continuation-token=${encodeURIComponent(
            nextContinuationToken,
          )}`;
        }

        const response = await axios.get(requestUrl);

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
      let formatted = err;
      if (err instanceof AxiosError) {
        formatted = formatAxiosError(err);
      }
      reject(formatted);
    }
  });
}
