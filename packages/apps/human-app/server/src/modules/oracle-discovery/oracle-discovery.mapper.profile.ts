import { Injectable } from '@nestjs/common';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import {
  CamelCaseNamingConvention,
  createMap,
  forMember,
  mapFrom,
  Mapper,
  namingConventions,
  SnakeCaseNamingConvention,
} from '@automapper/core';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryDto,
} from './model/oracle-discovery.model';

@Injectable()
export class OracleDiscoveryProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        OracleDiscoveryDto,
        OracleDiscoveryCommand,
        forMember(
          (destination) => destination.selectedJobTypes,
          mapFrom((source) => source.selected_job_types),
        ),
      );
    };
  }
}
