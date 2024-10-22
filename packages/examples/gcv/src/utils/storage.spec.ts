import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { parseString } from 'xml2js';
import { generateBucketUrl, listObjectsInBucket } from './storage';
import { StorageDataDto } from '../dto/storage';
import { AWSRegions, StorageProviders } from '../enums/storage';
import { ErrorBucket } from '../constants/errors';

jest.mock('axios');
jest.mock('xml2js');

describe('Storage Functions', () => {
    describe('generateBucketUrl', () => {
        it('should generate AWS bucket URL with path', () => {
            const storageData: StorageDataDto = {
                provider: StorageProviders.AWS,
                region: AWSRegions.US_EAST_1,
                bucketName: 'my-bucket',
                path: 'my/path/',
            };
            const result = generateBucketUrl(storageData);
            expect(result.toString()).toBe(
                'https://my-bucket.s3.us-east-1.amazonaws.com/my/path'
            );
        });

        it('should generate GCS bucket URL without path', () => {
            const storageData: StorageDataDto = {
                provider: StorageProviders.GCS,
                region: null,
                bucketName: 'my-bucket',
                path: '',
            };
            const result = generateBucketUrl(storageData);
            expect(result.toString()).toBe(
                'https://my-bucket.storage.googleapis.com/'
            );
        });

        it('should generate local bucket URL', () => {
            process.env.S3_ENDPOINT = 'localhost';
            process.env.S3_PORT = '9000';
            const storageData: StorageDataDto = {
                provider: StorageProviders.LOCAL,
                region: null,
                bucketName: 'my-local-bucket',
                path: 'path/to/file',
            };
            const result = generateBucketUrl(storageData);
            expect(result.toString()).toBe(
                'http://localhost:9000/my-local-bucket/path/to/file'
            );
        });

        it('should throw an error for invalid provider', () => {
            const storageData: StorageDataDto = {
                provider: 'INVALID_PROVIDER' as StorageProviders,
                region: null,
                bucketName: 'my-bucket',
                path: '',
            };
            expect(() => generateBucketUrl(storageData)).toThrow(ErrorBucket.InvalidProvider);
        });

        it('should throw an error for empty bucket name', () => {
            const storageData: StorageDataDto = {
                provider: StorageProviders.AWS,
                region: AWSRegions.US_EAST_1,
                bucketName: '',
                path: '',
            };
            expect(() => generateBucketUrl(storageData)).toThrow(ErrorBucket.EmptyBucket);
        });

        it('should throw an error for empty region in AWS', () => {
            const storageData: StorageDataDto = {
                provider: StorageProviders.AWS,
                region: null,
                bucketName: 'my-bucket',
                path: '',
            };
            expect(() => generateBucketUrl(storageData)).toThrow(ErrorBucket.EmptyRegion);
        });

        it('should throw an error for invalid region', () => {
            const storageData: StorageDataDto = {
                provider: StorageProviders.AWS,
                region: 'INVALID_REGION' as AWSRegions,
                bucketName: 'my-bucket',
                path: '',
            };
            expect(() => generateBucketUrl(storageData)).toThrow(ErrorBucket.InvalidRegion);
        });
    });

    describe('listObjectsInBucket', () => {
        it('should return object keys when API responds with valid data', async () => {
            const mockUrl = new URL('https://my-bucket.s3.us-east-1.amazonaws.com');
            const mockResponse = {
                status: HttpStatus.OK,
                data: '<ListBucketResult><Contents><Key>file1.txt</Key><Key>file2.txt</Key></Contents></ListBucketResult>',
            };

            (axios.get as jest.Mock).mockResolvedValue(mockResponse);
            (parseString as jest.Mock).mockImplementation((data, callback) => {
                callback(null, { ListBucketResult: { Contents: [{ Key: 'file1.txt' }, { Key: 'file2.txt' }] } } );
            });

            const result = await listObjectsInBucket(mockUrl);
            expect(result).toEqual(['file1.txt', 'file2.txt']);
        });

        it('should handle errors from the axios request', async () => {
            const mockUrl = new URL('https://my-bucket.s3.us-east-1.amazonaws.com');
            (axios.get as jest.Mock).mockRejectedValue(new Error('Network Error'));

            await expect(listObjectsInBucket(mockUrl)).rejects.toThrow('Network Error');
        });

        it('should handle errors when parsing XML', async () => {
            const mockUrl = new URL('https://my-bucket.s3.us-east-1.amazonaws.com');
            const mockResponse = {
                status: HttpStatus.OK,
                data: '<ListBucketResult></ListBucketResult>',
            };

            (axios.get as jest.Mock).mockResolvedValue(mockResponse);
            (parseString as jest.Mock).mockImplementation((data, callback) => {
                callback(new Error('Parse Error'), null);
            });

            await expect(listObjectsInBucket(mockUrl)).rejects.toThrow('Parse Error');
        });
    });
});