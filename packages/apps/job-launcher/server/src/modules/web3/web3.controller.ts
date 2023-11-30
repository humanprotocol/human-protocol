import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Web3Service } from './web3.service';
import { ChainId } from '@human-protocol/sdk';

@ApiTags('Web3')
@Controller('/web3')
export class Web3Controller {
  constructor(private readonly web3Service: Web3Service) {}

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
    return this.web3Service.getValidChains();
  }
}
console.log(ChainId);
