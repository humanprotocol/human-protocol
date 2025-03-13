import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NDAConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Latest NDA Url.
   */
  get latestNdaUrl(): string {
    return this.configService.getOrThrow<string>('NDA_URL');
  }
}
