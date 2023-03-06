import { WebhookStatus } from "../../common/decorators";
import { IWebhookCommonDto } from "../../common/dto/webhook-common";

export interface IWebhookUpdateDto extends IWebhookCommonDto {
  status?: WebhookStatus;
  waitUntil: Date;
}
