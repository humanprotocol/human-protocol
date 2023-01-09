import { S3Client } from "https://deno.land/x/s3_lite_client@0.3.0/mod.ts";


const minioHost = Deno.env.get("MINIO_HOST") || 'localhost';
const minioPort = Number(Deno.env.get("MINIO_PORT") )|| 9000;
const minioAccessKey = Deno.env.get("MINIO_ACCESS_KEY") || 'dev';
const minioSecretKey = Deno.env.get("MINIO_SECRET_KEY") || 'devdevdev';
const minioBucketName = Deno.env.get("MINIO_BUCKET_NAME") || 'job-results';

const s3client = new S3Client({
  endPoint: minioHost,
  port: minioPort,
  useSSL: false,
  region: "dev-region",
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
  bucket: minioBucketName,
  pathStyle: true,
});



export async function uploadResults(fortunes: string[], escrowAddress: string) {
  const fileName = `${escrowAddress}.json`;

  const bucketExists = await s3client.exists(minioBucketName);
  if (!bucketExists) {
    await s3client.putObject(minioBucketName, '');
  }
  await s3client.putObject(
    minioBucketName,
    fileName,
    JSON.parse(fortunes)
  );

  // the url is available for 7 days since the issue
  const url = await s3client.getPresignedUrl('GET', minioBucketName, fileName);

  return url;
}
