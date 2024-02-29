import { Injectable } from '@nestjs/common';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, Mapper } from '@automapper/core';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryData,
  OracleDiscoveryDto,
} from './interface/oracle-discovery.interface';

@Injectable()
export class JobDiscoveryProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, OracleDiscoveryDto, OracleDiscoveryCommand);
    };
  }
}
