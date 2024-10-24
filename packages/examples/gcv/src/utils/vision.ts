import * as fs from 'fs';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { generateBucketUrl, listObjectsInBucket } from './storage';
import { StorageDataDto } from '../dto/storage';
import { ErrorCommon } from '../constants/errors';

export class VisionModeration {
  private visionClient: ImageAnnotatorClient;

  constructor(projectId: string, privateKey: string, clientEmail: string) {
    this.visionClient = new ImageAnnotatorClient({
      projectId,
      credentials: {
        private_key: privateKey,
        client_email: clientEmail,
      },
    });
  }

  /**
   * Analyze a remote image for moderation using Google Cloud Vision API.
   */
  public async analyzeRemoteImageForModeration(imageUrl: string) {
    try {
      const [result] = await this.visionClient.safeSearchDetection({
        image: { source: { imageUri: imageUrl } },
      });
      const safeSearch = result.safeSearchAnnotation;

      if (safeSearch) {
        return {
          imageUrl,
          moderationResult: {
            adult: safeSearch.adult,
            violence: safeSearch.violence,
            racy: safeSearch.racy,
            spoof: safeSearch.spoof,
            medical: safeSearch.medical,
          },
        };
      } else {
        console.error(
          `No safeSearchAnnotation found for the image: ${imageUrl}`
        );
        return null;
      }
    } catch (error) {
      console.error(`Error analyzing image at ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Save the moderation results to a JSON file.
   */
  public saveResultsToJson(results: any[], jsonFilePath: string) {
    const currentData = fs.existsSync(jsonFilePath)
      ? JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'))
      : [];
    const updatedData = currentData.concat(results);

    fs.writeFileSync(jsonFilePath, JSON.stringify(updatedData, null, 2));
  }

  /**
   * Process all images in a dataset for moderation.
   */
  public async processDataset(storageData: StorageDataDto) {
    try {
      const bucketUrl = generateBucketUrl(storageData);
      const objectKeys = await listObjectsInBucket(bucketUrl);
      const imageUrls = objectKeys.map(
        (objectKey) =>
          `${bucketUrl.protocol}//${bucketUrl.host}${bucketUrl.pathname}/${objectKey}`
      );

      const moderationResults = await Promise.all(
        imageUrls.map((imageUrl) =>
          this.analyzeRemoteImageForModeration(imageUrl)
        )
      );

      const validResults = moderationResults.filter(
        (result) => result !== null
      );
      const resultsJsonPath = './results.json';

      if (validResults.length > 0) {
        this.saveResultsToJson(validResults, resultsJsonPath);
        console.log('Processing completed. Results saved to results.json.');
      } else {
        console.log('No valid moderation results to save.');
      }
    } catch (error) {
      console.error('Error processing dataset:', error);
      throw new Error(ErrorCommon.ErrorProcessingDataset);
    }
  }
}
