import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import * as Minio from 'minio';
import { Type } from '@sinclair/typebox';
import Ajv from 'ajv';

const ConfigSchema = Type.Strict(
  Type.Object({
    S3_HOST: Type.String(),
    S3_PORT: Type.Number(),
    S3_ACCESS_KEY: Type.String(),
    S3_SECRET_KEY: Type.String(),
    S3_BUCKET_NAME: Type.String(),
    S3_BASE_URL: Type.String(),
  })
);

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
});

class S3Client {
  private s3Client: Minio.Client;
  private s3Host = process.env.S3_HOST as string;
  private s3Port = Number(process.env.S3_PORT);
  private s3AccessKey = process.env.S3_ACCESS_KEY as string;
  private s3SecretKey = process.env.S3_SECRET_KEY as string;
  private s3BucketName = process.env.S3_BUCKET_NAME as string;
  private s3BaseUrl = process.env.S3_BASE_URL as string;
  constructor() {
    this.s3Client = new Minio.Client({
      endPoint: this.s3Host,
      port: this.s3Port,
      accessKey: this.s3AccessKey,
      secretKey: this.s3SecretKey,
      useSSL: false,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async uploadManifest(escrowData: any, escrowAddress: string) {
    const fileName = `${escrowAddress}-manifest.json`;
    const bucketExists = await this.s3Client.bucketExists(this.s3BucketName);
    if (!bucketExists) {
      await this.s3Client.makeBucket(process.env.S3_BUCKET_NAME as string, '');
    }
    await this.s3Client.putObject(
      this.s3BucketName,
      fileName,
      JSON.stringify(escrowData),
      { 'Content-Type': 'application/json' }
    );
    return `${this.s3BaseUrl}${this.s3BucketName}/${fileName}`;
  }
}

const s3Plugin: FastifyPluginAsync = async (server) => {
  const validate = ajv.compile(ConfigSchema);
  const valid = validate(process.env);
  if (!valid) {
    throw new Error(
      '.env file validation failed - ' +
        JSON.stringify(validate.errors, null, 2)
    );
  }
  server.decorate('s3', new S3Client());
};

declare module 'fastify' {
  interface FastifyInstance {
    s3: S3Client;
  }
}

export default fp(s3Plugin);
