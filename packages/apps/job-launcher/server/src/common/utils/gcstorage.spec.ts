import {
  constructGcsPath,
  convertToGCSPath,
  convertToHttpUrl,
  isGCSBucketUrl,
} from './gcstorage';
import { ErrorBucket } from '../constants/errors';

jest.mock('axios');

describe('Google Cloud Storage utils', () => {
  describe('isGCSBucketUrl', () => {
    it('should return true for a valid GCS HTTP URL', () => {
      expect(
        isGCSBucketUrl(
          'https://valid-bucket-with-file.storage.googleapis.com/object.jpg',
        ),
      ).toBe(true);
      expect(
        isGCSBucketUrl('https://valid-bucket.storage.googleapis.com/'),
      ).toBe(true);
      expect(
        isGCSBucketUrl('https://valid-bucket.storage.googleapis.com'),
      ).toBe(true);
    });

    it('should return true for a valid GCS gs:// URL', () => {
      expect(isGCSBucketUrl('gs://valid-bucket-with-file/object.jpg')).toBe(
        true,
      );
      expect(isGCSBucketUrl('gs://valid-bucket/')).toBe(true);
      expect(isGCSBucketUrl('gs://valid-bucket')).toBe(true);
    });

    it('should return false for an invalid GCS HTTP URL', () => {
      expect(isGCSBucketUrl('https://invalid-url.com/object.jpg')).toBe(false);
    });

    it('should return false for an invalid gs:// URL', () => {
      expect(isGCSBucketUrl('gs:/invalid-bucket/object.jpg')).toBe(false);
    });

    it('should return false for a completely invalid URL', () => {
      expect(isGCSBucketUrl('randomstring')).toBe(false);
    });

    it('should return false for a GCS URL with an invalid bucket name', () => {
      expect(isGCSBucketUrl('https://_invalid.storage.googleapis.com')).toBe(
        false,
      );
      expect(isGCSBucketUrl('gs://sh.storage.googleapis.com')).toBe(false);
      expect(isGCSBucketUrl('https://test-.storage.googleapis.com')).toBe(
        false,
      );
      expect(isGCSBucketUrl('https://-test.storage.googleapis.com')).toBe(
        false,
      );
    });
  });

  describe('convertToGCSPath', () => {
    it('should convert a valid GCS HTTP URL to a gs:// path', () => {
      expect(
        convertToGCSPath(
          'https://valid-bucket.storage.googleapis.com/object.jpg',
        ),
      ).toBe('gs://valid-bucket/object.jpg');
    });

    it('should convert a valid GCS HTTP URL without an object path to a gs:// bucket path', () => {
      expect(
        convertToGCSPath('https://valid-bucket.storage.googleapis.com'),
      ).toBe('gs://valid-bucket/');

      expect(
        convertToGCSPath('https://valid-bucket.storage.googleapis.com/'),
      ).toBe('gs://valid-bucket/');
    });

    it('should throw a Error for an invalid GCS URL', () => {
      expect(() =>
        convertToGCSPath('https://invalid-url.com/object.jpg'),
      ).toThrow(new Error(ErrorBucket.InvalidGCSUrl));
    });

    it('should throw a Error for a URL with an invalid bucket name', () => {
      expect(() =>
        convertToGCSPath('https://invalid_bucket.storage.googleapis.com'),
      ).toThrow(new Error(ErrorBucket.InvalidGCSUrl));
    });
  });

  describe('convertToHttpUrl', () => {
    it('should convert a gs:// path to a valid HTTP URL', () => {
      const result = convertToHttpUrl('gs://valid-bucket/object.jpg');
      expect(result).toBe(
        'https://valid-bucket.storage.googleapis.com/object.jpg',
      );
    });

    it('should convert a gs:// bucket path without an object to an HTTP bucket URL', () => {
      expect(convertToHttpUrl('gs://valid-bucket/')).toBe(
        'https://valid-bucket.storage.googleapis.com/',
      );
      expect(convertToHttpUrl('gs://valid-bucket')).toBe(
        'https://valid-bucket.storage.googleapis.com/',
      );
    });

    it('should throw a Error for an invalid gs:// path', () => {
      expect(() => convertToHttpUrl('invalid-gcs-path')).toThrow(
        new Error(ErrorBucket.InvalidGCSUrl),
      );
    });

    it('should throw a Error if the gs:// format is incorrect', () => {
      expect(() => convertToHttpUrl('gs:/missing-slash/object.jpg')).toThrow(
        new Error(ErrorBucket.InvalidGCSUrl),
      );
    });

    it('should throw a Error for an invalid bucket name in gs:// path', () => {
      expect(() => convertToHttpUrl('gs://_invalid/object.jpg')).toThrow(
        new Error(ErrorBucket.InvalidGCSUrl),
      );
      expect(() => convertToHttpUrl('gs://test-/object.jpg')).toThrow(
        new Error(ErrorBucket.InvalidGCSUrl),
      );
    });
  });

  describe('constructGcsPath', () => {
    it('should correctly construct a GCS path with multiple segments', () => {
      expect(constructGcsPath('my-bucket', 'folder', 'file.jpg')).toBe(
        'gs://my-bucket/folder/file.jpg',
      );
    });

    it('should handle leading and trailing slashes properly', () => {
      expect(constructGcsPath('my-bucket/', '/folder/', '/file.jpg')).toBe(
        'gs://my-bucket/folder/file.jpg',
      );
    });

    it('should remove extra slashes and normalize path segments', () => {
      expect(
        constructGcsPath('my-bucket', '///folder///', '///file.jpg///'),
      ).toBe('gs://my-bucket/folder/file.jpg');
    });

    it('should handle cases where no additional paths are provided', () => {
      expect(constructGcsPath('my-bucket')).toBe('gs://my-bucket');
    });

    it('should handle empty segments gracefully', () => {
      expect(constructGcsPath('my-bucket', '', 'file.jpg')).toBe(
        'gs://my-bucket/file.jpg',
      );
    });

    it('should construct a path with nested directories correctly', () => {
      expect(
        constructGcsPath('my-bucket', 'folder1', 'folder2', 'file.jpg'),
      ).toBe('gs://my-bucket/folder1/folder2/file.jpg');
    });

    it('should not add an extra slash if the base path already ends with one', () => {
      expect(constructGcsPath('my-bucket/', 'file.jpg')).toBe(
        'gs://my-bucket/file.jpg',
      );
    });

    it('should correctly handle a single trailing slash in the base path', () => {
      expect(constructGcsPath('my-bucket/', '')).toBe('gs://my-bucket');
    });

    it('should correctly handle a bucket name that already includes gs://', () => {
      expect(constructGcsPath('gs://my-bucket', 'folder', 'file.jpg')).toBe(
        'gs://my-bucket/folder/file.jpg',
      );
    });

    it('should correctly handle a bucket name with gs:// and a trailing slash', () => {
      expect(constructGcsPath('gs://my-bucket/', 'folder', 'file.jpg')).toBe(
        'gs://my-bucket/folder/file.jpg',
      );
    });

    it('should handle paths that contain only slashes', () => {
      expect(constructGcsPath('my-bucket', '/', '/')).toBe('gs://my-bucket');
    });
  });
});
