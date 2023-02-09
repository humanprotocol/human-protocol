import * as Minio from 'minio';

const minioHost = process.env.MINIO_HOST || 'localhost';
const minioPort = Number(process.env.MINIO_PORT) || 9000;
const minioAccessKey = process.env.MINIO_ACCESS_KEY || 'dev';
const minioSecretKey = process.env.MINIO_SECRET_KEY || 'devdevdev';
const minioBucketName = process.env.MINIO_BUCKET_NAME || 'job-results';

const minioClient = new Minio.Client({
  endPoint: minioHost,
  port: minioPort,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
  useSSL: false,
});

export async function uploadResults(result: string[], escrowAddress: string) {
  const fileName = `${escrowAddress}-result.json`;

  const bucketExists = await minioClient.bucketExists(minioBucketName);
  if (!bucketExists) {
    await minioClient.makeBucket(minioBucketName, '');
  }
  await minioClient.putObject(
    minioBucketName,
    fileName,
    JSON.stringify(result),
    { 'Content-Type': 'application/json' }
  );

  // the url is available for 7 days since the issue
  const url = await minioClient.presignedUrl('GET', minioBucketName, fileName);

  return url;
}
