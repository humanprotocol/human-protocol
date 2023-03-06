import { WebhookStatus } from "../../common/decorators";

export interface IWebhookCreateDto {
  signature: string;
  chainId: number;
  escrowAddress: string;
  s3Url: string;
  retriesCount: number;
  status: WebhookStatus;
  waitUntil: Date;
}
