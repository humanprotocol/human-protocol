import { AWSRegions, StorageProviders } from '../enums/storage';
import { JobRequestType } from '../enums/job';
import axios from 'axios';
import { StorageDataDto } from '../../modules/job/job.dto';
import { generateBucketUrl, listObjectsInBucket } from './storage';

jest.mock('axios');

describe('Storage utils', () => {
  describe('listObjectsInBucket', () => {
    it('should return an array of object keys when given valid storageData and jobType', async () => {
      const storageData: StorageDataDto = {
        provider: StorageProviders.AWS,
        region: AWSRegions.US_EAST_1,
        bucketName: 'my-bucket',
        path: 'my-folder',
      };
      const url = generateBucketUrl(storageData, JobRequestType.IMAGE_POINTS);
      const objects = ['object1', 'object2'];
      const response = {
        status: 200,
        data: `
        <ListBucketResult>
          <Contents>
            <Key>object1</Key>
          </Contents>
          <Contents>
            <Key>object2</Key>
          </Contents>
        </ListBucketResult>
      `,
      };
      axios.get = jest.fn().mockResolvedValueOnce(response);

      const result = await listObjectsInBucket(url);

      expect(result).toEqual(objects);
    });

    it('should handle pagination and return all object keys when NextContinuationToken exists', async () => {
      const storageData: StorageDataDto = {
        provider: StorageProviders.AWS,
        region: AWSRegions.US_EAST_1,
        bucketName: 'my-bucket',
        path: 'my-folder',
      };
      const url = generateBucketUrl(storageData, JobRequestType.IMAGE_POINTS);
      const objects = Array.from({ length: 4 }, (_, i) => `object${i + 1}`);
      const response1 = {
        status: 200,
        data: `
        <ListBucketResult>
          <NextContinuationToken>token1</NextContinuationToken>
          <Contents>
            <Key>object1</Key>
          </Contents>
          <Contents>
            <Key>object2</Key>
          </Contents>
        </ListBucketResult>
      `,
      };
      const response2 = {
        status: 200,
        data: `
        <ListBucketResult>
          <Contents>
            <Key>object3</Key>
          </Contents>
          <Contents>
            <Key>object4</Key>
          </Contents>
        </ListBucketResult>
      `,
      };
      axios.get = jest
        .fn()
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);

      const result = await listObjectsInBucket(url);

      expect(result).toEqual(objects);
    });

    it('should return an empty array when there are no objects in the bucket', async () => {
      const storageData: StorageDataDto = {
        provider: StorageProviders.AWS,
        region: AWSRegions.US_EAST_1,
        bucketName: 'my-bucket',
        path: 'my-folder',
      };
      const url = generateBucketUrl(storageData, JobRequestType.IMAGE_POINTS);
      const response = {
        status: 200,
        data: `
        <ListBucketResult>
        </ListBucketResult>
      `,
      };
      axios.get = jest.fn().mockResolvedValueOnce(response);

      const result = await listObjectsInBucket(url);

      expect(result).toEqual([]);
    });

    it('should reject with an error when the bucket does not exist', async () => {
      const storageData: StorageDataDto = {
        provider: StorageProviders.AWS,
        region: AWSRegions.US_EAST_1,
        bucketName: 'non-existent-bucket',
        path: 'my-folder',
      };
      const url = generateBucketUrl(storageData, JobRequestType.IMAGE_POINTS);
      const response = {
        status: 404,
        data: 'Bucket not found',
      };
      axios.get = jest.fn().mockResolvedValueOnce(response);

      await expect(listObjectsInBucket(url)).rejects.toEqual(
        'Failed to fetch bucket contents',
      );
    });

    it('should reject with an error when the bucket is not public', async () => {
      const storageData: StorageDataDto = {
        provider: StorageProviders.AWS,
        region: AWSRegions.US_EAST_1,
        bucketName: 'private-bucket',
        path: 'my-folder',
      };
      const url = generateBucketUrl(storageData, JobRequestType.IMAGE_POINTS);
      const response = {
        status: 403,
        data: 'Access denied',
      };
      axios.get = jest.fn().mockResolvedValueOnce(response);

      await expect(listObjectsInBucket(url)).rejects.toEqual(
        'Failed to fetch bucket contents',
      );
    });
  });
});
