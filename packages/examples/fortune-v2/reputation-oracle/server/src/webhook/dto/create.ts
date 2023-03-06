import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsString } from "class-validator";
import { WebhookStatus } from "../../common/decorators";
import { IWebhookCreateDto } from "../interfaces";

export class JobCreateDto implements IWebhookCreateDto {
  @ApiProperty()
  @IsString()
  public signature: string;

  @ApiPropertyOptional()
  @IsNumber()
  public chainId: number;

  @ApiProperty()
  @IsString()
  public escrowAddress: string;

  @ApiProperty()
  @IsString()
  public s3Url: string;

  @ApiProperty()
  @IsNumber()
  public retriesCount: number;

  @ApiPropertyOptional({
    enum: WebhookStatus,
  })
  @IsEnum(WebhookStatus)
  public status: WebhookStatus;

  @ApiProperty()
  @IsString()
  public waitUntil: Date;
}
