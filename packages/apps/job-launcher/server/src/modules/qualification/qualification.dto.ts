import { ApiProperty } from '@nestjs/swagger';

export class QualificationDto {
  @ApiProperty({
    type: String,
  })
  public reference: string;

  @ApiProperty({
    type: String,
  })
  public title: string;

  @ApiProperty({
    type: String,
  })
  public description: string;

  @ApiProperty({
    type: Date,
  })
  public expiresAt?: Date | null;
}
