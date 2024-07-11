import { Expose, Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionPaginationDto {
  @ApiProperty({ example: 12345 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Expose()
  public block: number;

  @ApiProperty({
    example:
      '0x020efc94ef6d9d7aa9a4886cc9e1659f4f2b63557133c29d51f387bcb0c4afd7',
  })
  @IsString()
  @Expose()
  public hash: string;

  @ApiProperty({ example: '0xad1F7e45D83624A0c628F1B03477c6E129EddB78' })
  @IsString()
  @Expose()
  public from: string;

  @ApiProperty({ example: '0xad1F7e45D83624A0c628F1B03477c6E129EddB78' })
  @IsString()
  @Expose()
  public to: string;

  @ApiProperty({ example: '0.123' })
  @Transform(({ value }) => value.toString())
  @IsString()
  @Expose()
  public value: string;

  @ApiProperty({ example: 'Transfer' })
  @IsString()
  @Expose()
  public method: string;
}
