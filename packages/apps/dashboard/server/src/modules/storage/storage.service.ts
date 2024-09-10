import { Injectable, NotFoundException } from '@nestjs/common';
import * as Minio from 'minio';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { Readable } from 'stream'; // Importar el tipo Readable para manejar streams

@Injectable()
export class StorageService {
  public readonly minioClient: Minio.Client;

  constructor(private s3ConfigService: S3ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.s3ConfigService.endpoint,
      port: this.s3ConfigService.port,
      accessKey: this.s3ConfigService.accessKey,
      secretKey: this.s3ConfigService.secretKey,
      useSSL: this.s3ConfigService.useSSL,
    });
  }

  public async downloadFile(key: string): Promise<any> {
    try {
      const isBucketExists = await this.minioClient.bucketExists(
        this.s3ConfigService.bucket,
      );
      if (!isBucketExists) {
        throw new NotFoundException('Bucket not found');
      }

      const response: Readable = await this.minioClient.getObject(
        this.s3ConfigService.bucket,
        key,
      );

      const chunks: any[] = [];
      return new Promise((resolve, reject) => {
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const fileContent = Buffer.concat(chunks).toString();
          try {
            resolve(JSON.parse(fileContent || ''));
          } catch (error) {
            reject(new Error('Error parsing JSON'));
          }
        });

        response.on('error', (err) => {
          reject(err);
        });
      });
    } catch (e) {
      console.log(e);
      return [];
    }
  }
}
