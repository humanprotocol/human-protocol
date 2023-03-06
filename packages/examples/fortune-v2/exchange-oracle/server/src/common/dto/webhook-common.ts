import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsString, IsUrl } from "class-validator";
import { ChainId, WebhookStatus } from "../decorators";

export interface IWebhookCommonDto {
  signature?: string;
  chainId?: ChainId;
  escrowAddress?: string;
  s3Url?: string;
  retriesCount?: number;
  status?: WebhookStatus;
  waitUntil?: Date;
}

export class WebhookCommonDto implements IWebhookCommonDto {
  @ApiPropertyOptional()
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiPropertyOptional()
  @IsString()
  public escrowAddress: string;

  @ApiPropertyOptional()
  @IsUrl()
  public s3Url: string;
}
