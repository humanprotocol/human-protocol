import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  HttpCode,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { NetworksService } from './networks.service';
import { ChainId } from '@human-protocol/sdk';

@ApiTags('Networks')
@Controller('/networks')
@UsePipes(new ValidationPipe({ transform: true }))
export class NetworksController {
  constructor(private readonly networksService: NetworksService) {}

  @Get('/available-networks')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get available networks with recent usage',
    description: 'Endpoint to return networks filtered by recent activity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Networks retrieved successfully',
    type: Array<ChainId>,
  })
  public async getAvailableNetworks(): Promise<ChainId[]> {
    return this.networksService.getOperatingNetworks();
  }
}
