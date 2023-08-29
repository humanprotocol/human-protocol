import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { ApiTags } from '@nestjs/swagger';
import { Web3Service } from './web3.service';
import { ChainId } from '@human-protocol/sdk';

@ApiTags('Web3')
@Controller('/web3')
export class Web3Controller {
  constructor(private readonly web3Service: Web3Service) {}

  @Public()
  @Get('/networks')
  getValidChains(): ChainId[] {
    return this.web3Service.getValidChains();
  }
}
