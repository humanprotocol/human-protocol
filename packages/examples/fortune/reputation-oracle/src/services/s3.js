const Minio = require('minio');
const fs = require('fs/promises');

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

const uploadResults = async (fortunes, escrowAddress) => {
  const fileName = `${escrowAddress}.json`;
  const filePath = `./data/${fileName}`;
  await fs.mkdir('./data', { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(fortunes));

  const bucketExists = await minioClient.bucketExists(minioBucketName);
  if (!bucketExists) {
    await minioClient.makeBucket(minioBucketName);
  }
  await minioClient.fPutObject(minioBucketName, fileName, filePath, { 'Content-Type': 'application/json' });

  // the url is available for 7 days since the issue
  const url = await minioClient.presignedUrl('GET', minioBucketName, fileName);

  return url;
};

module.exports = {
  uploadResults,
};
