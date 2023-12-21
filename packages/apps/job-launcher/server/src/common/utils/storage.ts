import { BadRequestException } from '@nestjs/common';
import { StorageDataDto } from '../../modules/job/job.dto';
import { AWSRegions, StorageProviders } from '../enums/storage';
import { ErrorBucket } from '../constants/errors';

export function generateBucketUrl(storageData: StorageDataDto): string {
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
        storageData.path ? `/${storageData.path.replace(/\/$/, '')}` : ''
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
