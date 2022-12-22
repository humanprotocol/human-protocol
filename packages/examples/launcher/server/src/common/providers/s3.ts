import { ConfigModule, ConfigService } from "@nestjs/config";
import { S3 } from "aws-sdk";

import { ProviderType } from "../constants/providers";

export const s3Provider = {
  provide: ProviderType.S3,
  inject: [ConfigService],
  import: [ConfigModule],
  useFactory: (configService: ConfigService): S3 => {
    const accessKeyId = configService.get<string>("AWS_ACCESS_KEY_ID", "AKIAU6WGWXBX4PNCWI7Q");
    const secretAccessKey = configService.get<string>("AWS_SECRET_ACCESS_KEY", "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");
    const region = configService.get<string>("AWS_REGION", "eu-west-3");
    return new S3({ accessKeyId, secretAccessKey, region });
  },
};
