import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Web3Service } from './web3.service';
import { ChainId } from '@human-protocol/sdk';
import { NetworkConfigService } from '../../common/config/network-config.service';

@ApiTags('Web3')
@Controller('/web3')
export class Web3Controller {
  constructor(
    private readonly web3Service: Web3Service,
    private readonly networkConfigService: NetworkConfigService,
  ) {}

  @ApiOperation({
    summary: 'Get valid network chains',
    description: 'Endpoint to get a list of valid network chains.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of valid network chains',
    schema: {
      type: 'array',
      items: {
        type: 'number',
        enum: Object.values(ChainId).filter(
          (value) => typeof value === 'number' && value > 0,
        ) as number[],
      },
    },
  })
  @Public()
  @Get('/networks')
  getValidChains(): ChainId[] {
    return this.networkConfigService.networks.map((network) => network.chainId);
  }

  @ApiOperation({
    summary: 'Get the address of the Job Launcher',
    description: 'Endpoint to get the address of the Job Launcher.',
  })
  @ApiResponse({
    status: 200,
    description: 'Job Launcher address',
    type: String,
  })
  @Public()
  @Get('/operator-address')
  getOperatorAddress(): string {
    return this.web3Service.getOperatorAddress();
  }
}
