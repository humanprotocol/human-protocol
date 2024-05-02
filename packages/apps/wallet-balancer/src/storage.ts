import { Encryption, HttpStatus } from '@human-protocol/sdk';
import * as Minio from 'minio';
import stringify from 'json-stable-stringify';
import axios from 'axios';
import { ConfigService } from './config';
import { isValidJSON } from './utils';
import { StorageError } from './errors';

/**
 * Service for managing storage operations.
 */
export class StorageService {
  public readonly minioClient: Minio.Client;

  /**
   * Constructs a new StorageService instance.
   * @param encryption The encryption service instance.
   * @param configService The configuration service instance.
   */
  constructor(
    private encryption: Encryption,
    private configService: ConfigService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.s3Endpoint,
      port: this.configService.s3Port,
      accessKey: this.configService.s3AccessKey,
      secretKey: this.configService.s3SecretKey,
      useSSL: this.configService.s3UseSSL,
    });
  }

  /**
   * Formats the URL for a given key.
   * @param key The key for which to format the URL.
   * @returns The formatted URL.
   */
  private formatUrl(key: string): string {
    return `${this.configService.s3UseSSL ? 'https' : 'http'}://${
      this.configService.s3Endpoint
    }:${this.configService.s3Port}/${this.configService.s3Bucket}/${key}`;
  }

  /**
   * Downloads data from storage.
   * @param key The key to download.
   * @returns The downloaded data.
   */
  public async download(key: string): Promise<any> {
    try {
      const url = this.formatUrl(key);

      const { data, status } = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (status !== HttpStatus.OK) {
        throw new Error(StorageError.STORAGE_FILE_NOT_FOUND);
      }

      let decryptedData = await this.encryption.decrypt(data);

      if (isValidJSON(decryptedData)) {
        decryptedData = JSON.parse(decryptedData);
      }

      return decryptedData;
    } catch {
      return [];
    }
  }

  /**
   * Uploads data to storage.
   * @param data The data to upload.
   * @param key The key under which to upload the data.
   * @returns The URL of the uploaded data.
   */
  public async upload(data: object, key: string): Promise<string> {
    if (!(await this.minioClient.bucketExists(this.configService.s3Bucket))) {
      throw new Error(StorageError.BUCKET_NOT_EXIST);
    }

    const encryptedData = await this.encryption.signAndEncrypt(
      stringify(data),
      [this.configService.pgpPublicKey],
    );

    try {
      await this.minioClient.putObject(
        this.configService.s3Bucket,
        key,
        encryptedData,
        {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store',
        },
      );

      return this.formatUrl(key);
    } catch (e) {
      throw new Error(StorageError.FILE_NOT_UPLOADED);
    }
  }

  /**
   * Updates existing data in storage.
   * @param data The updated data.
   * @param key The key of the data to update.
   * @returns The URL of the updated data.
   */
  public async update(data: object, key: string): Promise<string> {
    try {
      // Check if the file exists
      const exists = await this.minioClient.statObject(
        this.configService.s3Bucket,
        key,
      );
      if (exists) {
        // If it exists, delete the existing file
        await this.delete(key);
      }
      // Upload the updated file
      return await this.upload(data, key);
    } catch (error) {
      throw new Error(StorageError.FAILD_UPDATE_FILE);
    }
  }

  /**
   * Deletes data from storage.
   * @param key The key of the data to delete.
   */
  public async delete(key: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.configService.s3Bucket, key);
    } catch (error) {
      throw new Error(StorageError.FAILED_DELETE_OBJECT);
    }
  }
}
