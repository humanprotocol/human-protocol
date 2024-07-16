import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, HttpCode } from '@nestjs/common';
import { StatsService } from './stats.service';
import { HmtPriceDto } from './dto/hmt-price.dto';

@ApiTags('Stats')
@Controller('/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('/hmt-price')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get current HMT price',
    description: 'Endpoint to return a current HMT price.',
  })
  @ApiResponse({
    status: 200,
    description: 'Price retrieved successfully',
    type: HmtPriceDto,
  })
  public async hmtPrice(): Promise<HmtPriceDto> {
    const hmtPrice = await this.statsService.hmtPrice();
    return { hmtPrice };
  }
}
