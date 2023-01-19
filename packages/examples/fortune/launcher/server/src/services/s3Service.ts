import * as Minio from 'minio';
import { escrow as escrowSchema } from '../schemas/escrow.js';

const minioHost = process.env.MINIO_HOST || 'storage.googleapis.com';
const minioPort = Number(process.env.MINIO_PORT) || 80;
const minioAccessKey = process.env.MINIO_ACCESS_KEY || '';
const minioSecretKey = process.env.MINIO_SECRET_KEY || '';
const minioBucketName = process.env.MINIO_BUCKET_NAME || '';
const baseUrl = '';

const minioClient = new Minio.Client({
  endPoint: minioHost,
  port: minioPort,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
  useSSL: false,
});

export async function uploadManifest(escrow: typeof escrowSchema.properties, escrowAddress: string) {
    const fileName = `${escrowAddress}-manifest.json`;

    const bucketExists = await minioClient.bucketExists(minioBucketName);
    if (!bucketExists) {
    await minioClient.makeBucket(minioBucketName, '');
    }
    await minioClient.putObject(
        minioBucketName,
        fileName,
        JSON.stringify(escrow),
        { 'Content-Type': 'application/json' }
    );
    return `${baseUrl}${fileName}`
}
