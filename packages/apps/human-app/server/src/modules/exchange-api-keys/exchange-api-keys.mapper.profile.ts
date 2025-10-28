import { Mapper, createMap } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import {
  EnrollExchangeApiKeysCommand,
  EnrollExchangeApiKeysDto,
} from './model/exchange-api-keys.model';

@Injectable()
export class ExchangeApiKeysProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, EnrollExchangeApiKeysDto, EnrollExchangeApiKeysCommand);
    };
  }
}
