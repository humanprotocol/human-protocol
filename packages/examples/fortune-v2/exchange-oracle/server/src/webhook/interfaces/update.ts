import { WebhookStatus } from "../../common/decorators";
import { IWebhookCommonDto } from "../../common/dto/webhook-common";

export interface IWebhookIncomingUpdateDto extends IWebhookCommonDto {
  status?: WebhookStatus;
  waitUntil?: Date;
}
