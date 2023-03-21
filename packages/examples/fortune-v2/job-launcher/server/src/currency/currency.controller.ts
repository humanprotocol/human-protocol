import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard } from "../common/guards";

import { CurrencyService } from "./currency.service";
import { GetRateDto } from "./dto";

@ApiBearerAuth()
@ApiTags("Currency")
@Controller("/currency")
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @UseGuards(RolesGuard)
  @Get("/rates")
  public async createCurrencyIntent(@Query() data: GetRateDto): Promise<any> {
    return this.currencyService.getRate(data.token, data.currency);
  }
}
