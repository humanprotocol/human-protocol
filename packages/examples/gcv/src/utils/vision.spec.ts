import * as fs from 'fs';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { generateBucketUrl, listObjectsInBucket } from './storage';
import { StorageDataDto } from '../dto/storage';
import { VisionModeration } from './vision';
import { ErrorCommon } from '../constants/errors';
import { AWSRegions, StorageProviders } from '../enums/storage';

jest.mock('fs');
jest.mock('@google-cloud/vision');
jest.mock('./storage');

describe('VisionModeration', () => {
  let visionModeration: VisionModeration;
  let mockBatchAnnotateImages: jest.Mock;

  beforeEach(() => {
    mockBatchAnnotateImages = jest.fn();
    (ImageAnnotatorClient as unknown as jest.Mock).mockImplementation(() => ({
      batchAnnotateImages: mockBatchAnnotateImages,
    }));

    visionModeration = new VisionModeration(
      'test-project-id',
      'test-private-key',
      'test-client-email'
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeImagesForModeration', () => {
    it('should return moderation results for a batch of valid image URLs', async () => {
      const mockResponses = {
        responses: [
          {
            safeSearchAnnotation: {
              adult: 'LIKELY',
              violence: 'VERY_UNLIKELY',
              racy: 'UNLIKELY',
              spoof: 'POSSIBLE',
              medical: 'VERY_UNLIKELY',
            },
          },
          {
            safeSearchAnnotation: {
              adult: 'VERY_LIKELY',
              violence: 'LIKELY',
              racy: 'VERY_UNLIKELY',
              spoof: 'UNLIKELY',
              medical: 'VERY_UNLIKELY',
            },
          },
        ],
      };
      mockBatchAnnotateImages.mockResolvedValue([mockResponses]);

      const result = await visionModeration.analyzeImagesForModeration([
        'http://test.com/image1.jpg',
        'http://test.com/image2.jpg',
      ]);

      expect(result).toEqual([
        {
          imageUrl: 'http://test.com/image1.jpg',
          moderationResult: {
            adult: 'LIKELY',
            violence: 'VERY_UNLIKELY',
            racy: 'UNLIKELY',
            spoof: 'POSSIBLE',
            medical: 'VERY_UNLIKELY',
          },
        },
        {
          imageUrl: 'http://test.com/image2.jpg',
          moderationResult: {
            adult: 'VERY_LIKELY',
            violence: 'LIKELY',
            racy: 'VERY_UNLIKELY',
            spoof: 'UNLIKELY',
            medical: 'VERY_UNLIKELY',
          },
        },
      ]);
    });

    it('should return an empty array if no moderation results are found', async () => {
      mockBatchAnnotateImages.mockResolvedValue([{
        responses: [{}], // No safeSearchAnnotation
      }]);

      const result = await visionModeration.analyzeImagesForModeration([
        'http://test.com/image.jpg',
      ]);

      expect(result).toEqual([]);
    });

    it('should return an empty array if an error occurs', async () => {
      mockBatchAnnotateImages.mockRejectedValue(new Error('API Error'));

      const result = await visionModeration.analyzeImagesForModeration([
        'http://test.com/image.jpg',
      ]);

      expect(result).toEqual([]);
      expect(mockBatchAnnotateImages).toHaveBeenCalled();
    });
  });

  describe('saveResultsToJson', () => {
    it('should overwrite results in the JSON file', () => {
      const results = [
        { imageUrl: 'http://test.com/image1.jpg', moderationResult: {} },
      ];
      const jsonFilePath = './results.json';

      visionModeration.saveResultsToJson(results, jsonFilePath);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        jsonFilePath,
        JSON.stringify(results, null, 2)
      );
    });
  });

  describe('processDataset', () => {
    it('should process all images in the dataset and save results', async () => {
      const mockBucketUrl = {
        protocol: 'http:',
        host: 'test-bucket.s3.amazonaws.com',
        pathname: '/images',
      };
      const mockObjectKeys = ['image1.jpg', 'image2.jpg'];
      const mockModerationResults = [
        { imageUrl: 'http://test.com/image1.jpg', moderationResult: { adult: 'LIKELY' } },
        { imageUrl: 'http://test.com/image2.jpg', moderationResult: { adult: 'VERY_LIKELY' } },
      ];

      (generateBucketUrl as jest.Mock).mockReturnValue(mockBucketUrl);
      (listObjectsInBucket as jest.Mock).mockResolvedValue(mockObjectKeys);

      jest
        .spyOn(visionModeration, 'analyzeImagesForModeration')
        .mockResolvedValue(mockModerationResults);

      jest
        .spyOn(visionModeration, 'saveResultsToJson');

      const storageData: StorageDataDto = {
        provider: StorageProviders.AWS,
        region: AWSRegions.AF_SOUTH_1,
        bucketName: 'test-bucket',
        path: 'images',
      };

      const result = await visionModeration.processDataset(storageData);

      expect(generateBucketUrl).toHaveBeenCalledWith(storageData);
      expect(listObjectsInBucket).toHaveBeenCalledWith(mockBucketUrl);
      expect(visionModeration.saveResultsToJson).toHaveBeenCalledWith(
        mockModerationResults,
        './results.json'
      );
      expect(result).toEqual({
        containsAbuse: 'true',
        abuseResultsFile: './results.json',
      });
    });

    it('should return false for containsAbuse if no abusive content is detected', async () => {
      const mockBucketUrl = {
        protocol: 'http:',
        host: 'test-bucket.s3.amazonaws.com',
        pathname: '/images',
      };
      const mockObjectKeys = ['image1.jpg'];
      const mockModerationResults = [
        { imageUrl: 'http://test.com/image1.jpg', moderationResult: { adult: 'LIKELY' } },
      ];

      (generateBucketUrl as jest.Mock).mockReturnValue(mockBucketUrl);
      (listObjectsInBucket as jest.Mock).mockResolvedValue(mockObjectKeys);
      jest
        .spyOn(visionModeration, 'analyzeImagesForModeration')
        .mockResolvedValue(mockModerationResults);

      const storageData: StorageDataDto = {
        provider: StorageProviders.AWS,
        region: AWSRegions.AF_SOUTH_1,
        bucketName: 'test-bucket',
        path: 'images',
      };

      const result = await visionModeration.processDataset(storageData);

      expect(result.containsAbuse).toBe('false');
    });

    it('should throw an error if processing fails', async () => {
      (listObjectsInBucket as jest.Mock).mockRejectedValue(
        new Error('Error listing objects')
      );

      const storageData: StorageDataDto = {
        provider: StorageProviders.AWS,
        region: AWSRegions.AF_SOUTH_1,
        bucketName: 'test-bucket',
        path: 'images',
      };

      await expect(
        visionModeration.processDataset(storageData)
      ).rejects.toThrow(ErrorCommon.ErrorProcessingDataset);
    });
  });
});
