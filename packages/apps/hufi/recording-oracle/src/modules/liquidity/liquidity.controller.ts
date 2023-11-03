import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { liquidityRequestDto } from './liquidity.dto';
import { LiquidityService } from './liquidity.service';
// import { SignatureAuthGuard } from '../../common/guards';
// import { Role } from '../../common/enums/role';
import { Public } from '../../common/decorators';

@Controller('/liquidity')
@ApiTags('liquidity')
export class LiquidityController {
  constructor(private readonly liquidityService: LiquidityService) {}

  // @UseGuards(new SignatureAuthGuard([Role.Exchange]))
  @Post()
  getLiquidity(@Body() body: liquidityRequestDto): Promise<any>{
    return this.liquidityService.getLiquidityScore(
      body
    )
  }
}
