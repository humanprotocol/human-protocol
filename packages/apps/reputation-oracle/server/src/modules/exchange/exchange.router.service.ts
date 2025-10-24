import { Injectable } from '@nestjs/common';

import { ExchangeCredentials, ExchangeService } from './exchange.service';
import { GateExchangeService } from './gate-exchange.service';
import { MexcExchangeService } from './mexc-exchange.service';

@Injectable()
export class ExchangeRouterService {
  private servicesMap: Record<string, ExchangeService>;

  constructor(
    private readonly mexcService: MexcExchangeService,
    private readonly gateService: GateExchangeService,
  ) {
    this.servicesMap = {
      mexc: this.mexcService,
      gate: this.gateService,
    };
  }

  checkRequiredCredentials(
    exchangeName: string,
    creds: ExchangeCredentials,
  ): boolean {
    const service = this.servicesMap[exchangeName.toLowerCase()];
    if (!service) {
      throw new Error(`Exchange service not found for ${exchangeName}`);
    }
    return service.checkRequiredCredentials(creds);
  }

  async checkRequiredAccess(
    exchangeName: string,
    creds: ExchangeCredentials,
  ): Promise<boolean> {
    const service = this.servicesMap[exchangeName.toLowerCase()];
    if (!service) {
      throw new Error(`Exchange service not found for ${exchangeName}`);
    }
    return service.checkRequiredAccess(creds);
  }

  async getAccountBalance(
    exchangeName: string,
    userId: number,
    asset?: string,
  ): Promise<number> {
    const service = this.servicesMap[exchangeName.toLowerCase()];
    if (!service) {
      throw new Error(`Exchange service not found for ${exchangeName}`);
    }
    return service.getAccountBalance(userId, asset);
  }
}
