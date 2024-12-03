import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, HttpCode } from '@nestjs/common';

import { ChainId } from '@human-protocol/sdk';
import { NetworkConfigService } from '../../common/config/network-config.service';

@ApiTags('Config')
@Controller('/config')
export class ConfigController {
  constructor(private readonly networkConfigService: NetworkConfigService) {}

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
    return this.networkConfigService.getAvailableNetworks();
  }
}
