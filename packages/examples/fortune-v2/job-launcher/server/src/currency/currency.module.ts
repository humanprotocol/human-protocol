import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { CurrencyController } from "./currency.controller";
import { CurrencyService } from "./currency.service";

@Module({
  imports: [HttpModule],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
