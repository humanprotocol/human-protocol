import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsEnum, IsString } from "class-validator";
import { WebhookStatus } from "../../common/decorators";

import { WebhookCommonDto } from "../../common/dto/webhook-common";
import { IWebhookIncomingUpdateDto } from "../interfaces";

export class UpdateIncomingWebhookDto extends WebhookCommonDto implements IWebhookIncomingUpdateDto {
  @ApiPropertyOptional({
    enum: WebhookStatus,
  })
  @IsEnum(WebhookStatus)
  public status: WebhookStatus;

  @ApiPropertyOptional()
  @IsDate()
  public waitUntil: Date;
}
