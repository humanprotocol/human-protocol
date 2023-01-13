import "dotenv/config";
import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import AWS from "aws-sdk";
import Ajv from "ajv";
import { v4 as uuid } from 'uuid';


const ConfigSchema = Type.Strict(
  Type.Object({
    AWS_ACCESS_KEY_ID: Type.String(),
    AWS_SECRET_ACCESS_KEY: Type.String(),
    AWS_BUCKET_NAME: Type.String(),
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
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID, 
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    });
  }
  
  async saveFile(data: any) {
    const s3Bucket = process.env.AWS_BUCKET_NAME || "";
    const fileName = `${uuid()}.json`;
    
    try {
      const params = {
        Bucket: s3Bucket,
        Key: fileName,
        Body: data,
        ContentType: "application/json",
      };
      const result = await this.s3.putObject(params).promise();
      console.log(
        `File uploaded successfully at https:/${s3Bucket}.s3.amazonaws.com/${fileName}`
      );
    } catch (error) {
      console.log("error");
    }
  }
}

const s3Plugin: FastifyPluginAsync = async (server) => {
  const validate = ajv.compile(ConfigSchema);
  const valid = validate(process.env);
  if (!valid) {
    throw new Error(
      ".env file validation failed - " +
        JSON.stringify(validate.errors, null, 2)
    );
  }

  server.decorate("s3", new S3Client());
};

declare module "fastify" {
  interface FastifyInstance {
    s3: S3Client;
  }
}

export default fp(s3Plugin);
