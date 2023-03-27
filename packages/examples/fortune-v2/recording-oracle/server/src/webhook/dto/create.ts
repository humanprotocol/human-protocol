import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
import { IWebhookCreateDto } from "../interfaces";

export class WebhookCreateDto implements IWebhookCreateDto {
  @ApiProperty()
  @IsString()
  public signature: string;
}
