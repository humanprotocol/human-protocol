import { AWSRegions, StorageProviders } from '../enums/storage';

export class StorageDataDto {
  public provider: StorageProviders;
  public region: AWSRegions | null;
  public bucketName: string;
  public path: string;
}
