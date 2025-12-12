import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class InternalTransaction {
  @ApiProperty()
  @Expose()
  from: string;
  @ApiProperty()
  @Expose()
  to: string;
  @ApiProperty()
  @Transform(({ value }) => value.toString())
  @Expose()
  value: string;
  @ApiProperty()
  @Expose()
  method: string;
  @ApiProperty()
  @Expose()
  receiver: string | null;
  @ApiProperty()
  @Expose()
  escrow: string | null;
  @ApiProperty()
  @Expose()
  token: string | null;
}

export class TransactionPaginationDto {
  @ApiProperty({
    example:
      '0x020efc94ef6d9d7aa9a4886cc9e1659f4f2b63557133c29d51f387bcb0c4afd7',
  })
  @Expose()
  txHash: string;

  @ApiProperty({ example: 'bulkTransfer' })
  @Expose()
  method: string;

  @ApiProperty({ example: '0xad1F7e45D83624A0c628F1B03477c6E129EddB78' })
  @Expose()
  from: string;

  @ApiProperty({ example: '0xad1F7e45D83624A0c628F1B03477c6E129EddB78' })
  @Expose()
  to: string;

  @ApiProperty({
    example: '0xad1F7e45D83624A0c628F1B03477c6E129EddB78',
  })
  @Expose()
  receiver: string | null;

  @ApiProperty({ example: 12345 })
  @Transform(({ value }) => Number(value))
  @Expose()
  block: number;

  @ApiProperty({ example: '0.123' })
  @Transform(({ value, obj }) => {
    return obj.currentAddress.toLowerCase() === obj.from.toLowerCase()
      ? `-${value.toString()}`
      : value.toString();
  })
  @Expose()
  value: string;

  @ApiProperty({
    type: [Object],
    description: 'List of transfers associated with the transaction',
  })
  @Type(() => InternalTransaction)
  @Expose()
  internalTransactions: InternalTransaction[];
}
