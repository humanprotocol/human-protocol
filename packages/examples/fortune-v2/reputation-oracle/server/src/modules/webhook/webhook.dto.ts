import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsEnum, IsString, IsUrl } from "class-validator";
import { WebhookStatus } from "../../common/decorators";
import { ChainId } from "@human-protocol/sdk";

export class WebhookIncomingCreateDto {
  @ApiProperty()
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiProperty()
  @IsString()
  public escrowAddress: string;

  public status?: WebhookStatus;
  public waitUntil?: Date;
}

export class WebhookIncomingUpdateDto {
  @ApiPropertyOptional()
  @IsEnum(ChainId)
  public chainId: ChainId;

  @ApiPropertyOptional()
  @IsString()
  public escrowAddress: string;

  @ApiPropertyOptional()
  @IsUrl()
  public resultsUrl: string;

  @ApiPropertyOptional({
    enum: WebhookStatus,
  })
  @IsEnum(WebhookStatus)
  public status: WebhookStatus;

  @ApiPropertyOptional()
  @IsDate()
  public waitUntil: Date;
}