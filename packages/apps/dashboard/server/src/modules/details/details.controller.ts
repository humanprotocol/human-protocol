import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, HttpCode, Param, Query } from '@nestjs/common';
import { ChainId } from '@human-protocol/sdk';

import { DetailsService } from './details.service';
import { DetailsDto } from './dto/details-response.dto';
import { WalletDto } from './dto/wallet.dto';
import { EscrowDto } from './dto/escrow.dto';
import { LeaderDto } from './dto/leader.dto';

@ApiTags('Details')
@Controller('/details')
export class DetailsController {
  constructor(private readonly detailsService: DetailsService) {}

  @Get('/:address')
  @ApiQuery({ name: 'chainId', enum: ChainId })
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get address details',
    description: 'Returns details about given address.',
  })
  @ApiResponse({
    status: 200,
    description: 'Details retrieved successfully',
    type: DetailsDto,
  })
  public async details(
    @Param('address') address: string,
    @Query('chainId') chainId: ChainId,
  ): Promise<DetailsDto> {
    const details: WalletDto | EscrowDto | LeaderDto =
      await this.detailsService.getDetails(chainId, address);
    if (details instanceof WalletDto) {
      const response: DetailsDto = {
        wallet: details,
      };
      return response;
    }
    if (details instanceof EscrowDto) {
      const response: DetailsDto = {
        escrow: details,
      };
      return response;
    }
    if (details instanceof LeaderDto) {
      const response: DetailsDto = {
        leader: details,
      };
      return response;
    }
  }
}
