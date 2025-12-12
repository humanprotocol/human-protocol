import axios from 'axios';
import { parseString } from 'xml2js';

export const listObjectsInBucket = async (
  bucketUrl: string,
): Promise<string[]> => {
  const response = await axios.get(bucketUrl);
  if (response.status === 200 && response.data) {
    return new Promise((resolve, reject) => {
      parseString(response.data, (err: any, result: any) => {
        if (err) {
          reject(err);
        }

        const objectKeys = result.ListBucketResult.Contents.map(
          (item: any) => item.Key,
        );
        resolve(objectKeys.flat());
      });
    });
  } else {
    throw new Error('Failed to list objects in bucket');
  }
};
