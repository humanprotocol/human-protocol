import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { IWebhookIncomingCreateDto } from "../interfaces";

export class WebhookIncomingCreateDto implements IWebhookIncomingCreateDto {
  @ApiProperty()
  @IsString()
  public signature: string;
}
