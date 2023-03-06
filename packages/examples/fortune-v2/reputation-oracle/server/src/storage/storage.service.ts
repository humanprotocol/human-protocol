import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MinioService } from "nestjs-minio-client";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3BucketName;
  private s3BaseUrl;

  constructor(private readonly configService: ConfigService, private readonly minioService: MinioService) {
    this.s3BucketName = configService.get("S3_BUCKET_NAME");
    this.s3BaseUrl = configService.get("S3_BASE_URL");
  }

  async saveData(fileName: string, data: any) {
    const bucketExists = await this.minioService.client.bucketExists(this.s3BucketName);
    if (!bucketExists) {
      await this.minioService.client.makeBucket(process.env.S3_BUCKET_NAME as string, "");
    }
    await this.minioService.client.putObject(this.s3BucketName, `${fileName}.json`, JSON.stringify(data), {
      "Content-Type": "application/json",
    });
    return `${this.s3BaseUrl}${this.s3BucketName}/${fileName}.json`;
  }

  async listAllBuckets() {
    return this.minioService.client.listBuckets();
  }
}
