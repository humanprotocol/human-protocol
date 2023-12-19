import { StorageDataDto } from '../../modules/job/job.dto';
import { StorageProviders } from '../enums/storage';

export function generateBucketUrl(s3Data: StorageDataDto): string {
  switch (s3Data.provider) {
    case StorageProviders.AWS:
      return `https://${s3Data.bucketName}.s3.${s3Data.region}.amazonaws.com${
        s3Data.path ? `/${s3Data.path}` : ''
      }`;
    // case StorageProviders.GCS:
    //   return `https://${s3Data.bucketName}.storage.googleapis.com${
    //     s3Data.path ? `/${s3Data.path}` : ''
    //   }`;
    default:
      throw Error('Invalid provider');
  }
}
