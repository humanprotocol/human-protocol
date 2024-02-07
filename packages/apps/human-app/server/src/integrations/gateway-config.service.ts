import { ConfigService } from "@nestjs/config";
import { GatewayConfig, Gateways } from "../common/config/enpoint.interface";
import { Injectable } from "@nestjs/common";


@Injectable // todo: fix this
export class GatewayConfigService {
  constructor(private configService: ConfigService) {}

  private getGatewaysConfig(): Gateways {
    return {
      gateways: {
        reputation_oracle: {
          url: this.configService.get<string>('REPUTATION_ORACLE_URL')!,
          endpoints: {
            workerSignup: {
              endpoint: "/auth/signup",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            },
            operatorSignup: {
              endpoint: "/auth/signup",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            },
          },
        },
      },
    };
  }
  getConfig(gateway: string): GatewayConfig {
    return this.getGatewaysConfig()["gateways"][gateway];
  }
}