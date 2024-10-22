import * as fs from 'fs';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { generateBucketUrl, listObjectsInBucket } from './storage';
import { StorageDataDto } from '../dto/storage';
import { VisionModeration } from './vision';
import { ErrorCommon } from '../constants/errors';
import { AWSRegions, StorageProviders } from '../enums/storage';

// Mock dependencies
jest.mock('fs');
jest.mock('@google-cloud/vision');
jest.mock('./storage');

describe('VisionModeration', () => {
  let visionModeration: VisionModeration;
  let mockSafeSearchDetection: jest.Mock;

  beforeEach(() => {
    // Set up mock for ImageAnnotatorClient
    mockSafeSearchDetection = jest.fn();
    (ImageAnnotatorClient as unknown as jest.Mock).mockImplementation(() => ({
      safeSearchDetection: mockSafeSearchDetection,
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

  describe('analyzeRemoteImageForModeration', () => {
    it('should return moderation results for a valid image URL', async () => {
      const mockResult = {
        safeSearchAnnotation: {
          adult: 'LIKELY',
          violence: 'VERY_UNLIKELY',
          racy: 'UNLIKELY',
          spoof: 'POSSIBLE',
          medical: 'VERY_UNLIKELY',
        },
      };
      mockSafeSearchDetection.mockResolvedValue([mockResult]);

      const result = await visionModeration.analyzeRemoteImageForModeration(
        'http://test.com/image.jpg'
      );

      expect(result).toEqual({
        imageUrl: 'http://test.com/image.jpg',
        moderationResult: {
          adult: 'LIKELY',
          violence: 'VERY_UNLIKELY',
          racy: 'UNLIKELY',
          spoof: 'POSSIBLE',
          medical: 'VERY_UNLIKELY',
        },
      });
    });

    it('should return null if safeSearchAnnotation is not found', async () => {
      mockSafeSearchDetection.mockResolvedValue([{}]);

      const result = await visionModeration.analyzeRemoteImageForModeration(
        'http://test.com/image.jpg'
      );

      expect(result).toBeNull();
    });

    it('should return null if an error occurs', async () => {
      mockSafeSearchDetection.mockRejectedValue(new Error('API Error'));

      const result = await visionModeration.analyzeRemoteImageForModeration(
        'http://test.com/image.jpg'
      );

      expect(result).toBeNull();
      expect(mockSafeSearchDetection).toHaveBeenCalled();
    });
  });

  describe('saveResultsToJson', () => {
    it('should append results to the JSON file', () => {
      const results = [
        { imageUrl: 'http://test.com/image.jpg', moderationResult: {} },
      ];
      const jsonFilePath = './results.json';

      // Mock fs.existsSync to return true (file exists)
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Mock fs.readFileSync to return existing data
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify([{ existing: 'data' }])
      );

      // Call the method
      visionModeration.saveResultsToJson(results, jsonFilePath);

      // Verify fs.writeFileSync was called with updated data
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        jsonFilePath,
        JSON.stringify([{ existing: 'data' }, ...results], null, 2)
      );
    });

    it('should create a new JSON file if it does not exist', () => {
      const results = [
        { imageUrl: 'http://test.com/image.jpg', moderationResult: {} },
      ];
      const jsonFilePath = './results.json';

      // Mock fs.existsSync to return false (file does not exist)
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Call the method
      visionModeration.saveResultsToJson(results, jsonFilePath);

      // Verify fs.writeFileSync was called with new data
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
      const mockObjectKeys = ['image1.jpg'];
      const mockModerationResults = [
        { imageUrl: 'http://test.com/image1.jpg', moderationResult: {} },
      ];

      // Mock storage methods
      (generateBucketUrl as jest.Mock).mockReturnValue(mockBucketUrl);
      (listObjectsInBucket as jest.Mock).mockResolvedValue(mockObjectKeys);

      // Mock analyzeRemoteImageForModeration to return mock results
      jest
        .spyOn(visionModeration, 'analyzeRemoteImageForModeration')
        .mockResolvedValue(mockModerationResults[0] as any);

      // Mock saveResultsToJson
      jest
        .spyOn(visionModeration, 'saveResultsToJson')
        .mockImplementation(jest.fn());

      // Create a StorageDataDto instance
      const storageData: StorageDataDto = {
        provider: StorageProviders.AWS,
        region: AWSRegions.AF_SOUTH_1,
        bucketName: 'test-bucket',
        path: 'images',
      };

      await visionModeration.processDataset(storageData);

      // Verify generateBucketUrl and listObjectsInBucket were called
      expect(generateBucketUrl).toHaveBeenCalledWith(storageData);
      expect(listObjectsInBucket).toHaveBeenCalledWith(mockBucketUrl);

      // Verify saveResultsToJson was called with the moderation results
      expect(visionModeration.saveResultsToJson).toHaveBeenCalledWith(
        mockModerationResults,
        './results.json'
      );
    });

    it('should throw an error if processing fails', async () => {
      // Mock listObjectsInBucket to throw an error
      (listObjectsInBucket as jest.Mock).mockRejectedValue(
        new Error('Error listing objects')
      );

      // Create a StorageDataDto instance
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
