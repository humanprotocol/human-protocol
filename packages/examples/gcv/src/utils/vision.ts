import * as fs from 'fs';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
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
   * Analyze a batch of remote images for moderation using Google Cloud Vision API.
   */
  public async analyzeImagesForModeration(imageUrls: string[]): Promise<any[]> {
    const batchRequest: protos.google.cloud.vision.v1.IBatchAnnotateImagesRequest = {
      requests: imageUrls.map(imageUrl => ({
        image: { source: { imageUri: imageUrl } },
        features: [{ type: 'SAFE_SEARCH_DETECTION' }],
      })),
    };

    try {
      const [responses]: any = await this.visionClient.batchAnnotateImages(batchRequest);
      console.log(responses)
      return responses.responses.map((response: protos.google.cloud.vision.v1.IAnnotateImageResponse, index: number) => {
        const safeSearch = response.safeSearchAnnotation;
        if (safeSearch) {
          return {
            imageUrl: imageUrls[index],
            moderationResult: {
              adult: safeSearch.adult,
              violence: safeSearch.violence,
              racy: safeSearch.racy,
              spoof: safeSearch.spoof,
              medical: safeSearch.medical,
            },
          };
        } else {
          console.error(`No safeSearchAnnotation found for the image: ${imageUrls[index]}`);
          return null;
        }
      }).filter((result: any) => result !== null);
    } catch (error) {
      console.error('Error analyzing images:', error);
      return [];
    }
  }

  /**
   * Save the moderation results to a JSON file.
   * This method now overwrites the existing results.json file each time it's called.
   */
  public saveResultsToJson(results: any[], jsonFilePath: string) {
    // Directly write the results to the JSON file, overwriting any existing data
    fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2));
  }

  /**
   * Process all images in a dataset for moderation.
   */
  public async processDataset(storageData: StorageDataDto): Promise<{ containsAbuse: string; abuseResultsFile: string }> {
    const resultsJsonPath = './results.json';
    let containsAbuse = false;

    try {
      const bucketUrl = generateBucketUrl(storageData);
      const objectKeys = await listObjectsInBucket(bucketUrl);
      const imageUrls = objectKeys.map(objectKey => `${bucketUrl.protocol}//${bucketUrl.host}${bucketUrl.pathname}/${objectKey}`);

      const moderationResults = await this.analyzeImagesForModeration(imageUrls);

      if (moderationResults.length > 0) {
        this.saveResultsToJson(moderationResults, resultsJsonPath);

        containsAbuse = moderationResults.some(result => 
          result.moderationResult.adult === "VERY_LIKELY" || 
          result.moderationResult.racy === "VERY_LIKELY" || 
          result.moderationResult.violence === "VERY_LIKELY" || 
          result.moderationResult.spoof === "VERY_LIKELY" || 
          result.moderationResult.medical === "VERY_LIKELY"
        );

        console.log('Processing completed. Results saved to results.json.');
      } else {
        console.log('No valid moderation results to save.');
      }
    } catch (error) {
      console.error('Error processing dataset:', error);
      throw new Error(ErrorCommon.ErrorProcessingDataset);
    }

    return {
      containsAbuse: containsAbuse ? 'true' : 'false',
      abuseResultsFile: resultsJsonPath,
    };
  }
}
