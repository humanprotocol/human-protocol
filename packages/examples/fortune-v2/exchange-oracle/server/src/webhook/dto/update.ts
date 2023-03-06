import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsEnum, IsString } from "class-validator";
import { WebhookStatus } from "../../common/decorators";

import { WebhookCommonDto } from "../../common/dto/webhook-common";
import { IWebhookUpdateDto } from "../interfaces";

export class UpdateWebhookDto extends WebhookCommonDto implements IWebhookUpdateDto {
  @ApiPropertyOptional({
    enum: WebhookStatus,
  })
  @IsEnum(WebhookStatus)
  public status: WebhookStatus;

  @ApiPropertyOptional()
  @IsDate()
  public waitUntil: Date;
}
