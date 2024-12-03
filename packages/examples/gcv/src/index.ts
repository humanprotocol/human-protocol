import * as dotenv from 'dotenv';
import { StorageProviders } from './enums/storage';
import { StorageDataDto } from './dto/storage';
import { VisionModeration } from './utils/vision';

dotenv.config();

const visionModeration = new VisionModeration(
  process.env.GOOGLE_PROJECT_ID!,
  process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')!,
  process.env.GOOGLE_CLIENT_EMAIL!
);

(async () => {
  const storageData: StorageDataDto = {
    provider: StorageProviders.LOCAL,
    region: null,
    bucketName: process.env.S3_BUCKET!,
    path: '',
  };

  console.log(await visionModeration.processDataset(storageData));
})();
