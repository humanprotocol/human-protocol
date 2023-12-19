import { BadRequestException } from '@nestjs/common';
import { StorageDataDto } from '../../modules/job/job.dto';
import { AWSRegions, StorageProviders } from '../enums/storage';
import { ErrorBucket } from '../constants/errors';

export function generateBucketUrl(s3Data: StorageDataDto): string {
  if (!s3Data.bucketName) {
    throw new BadRequestException(ErrorBucket.EmptyBucket);
  }
  switch (s3Data.provider) {
    case StorageProviders.AWS:
      if (!s3Data.region) {
        throw new BadRequestException(ErrorBucket.EmptyRegion);
      }
      if (!isRegion(s3Data.region)) {
        throw new BadRequestException(ErrorBucket.InvalidRegion);
      }
      return `https://${s3Data.bucketName}.s3.${s3Data.region}.amazonaws.com${
        s3Data.path ? `/${s3Data.path}` : ''
      }`;
    // case StorageProviders.GCS:
    //   return `https://${s3Data.bucketName}.storage.googleapis.com${
    //     s3Data.path ? `/${s3Data.path}` : ''
    //   }`;
    default:
      throw new BadRequestException(ErrorBucket.InvalidProvider);
  }
}

function isRegion(value: string): value is AWSRegions {
  return Object.values(AWSRegions).includes(value as AWSRegions);
}
