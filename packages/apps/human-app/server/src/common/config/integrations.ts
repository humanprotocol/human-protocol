import { ConfigService } from '@nestjs/config';

interface IntegrationDto {
  url: string;
}

interface IntegrationsMapDto {
  [key: string]: IntegrationDto;
}

export class IntegrationsMap {
  private configService: ConfigService;
  private map: IntegrationsMapDto;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.map = {
      reputation_oracle: {
        url: this.configService.get<string>('REPUTATION_ORACLE_URL')!,
      },
    };
  }

  getMap(): IntegrationsMapDto {
    return this.map;
  }
}
