import { Injectable } from '@nestjs/common';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import {
  CamelCaseNamingConvention,
  createMap,
  Mapper,
  namingConventions,
  SnakeCaseNamingConvention,
} from '@automapper/core';
import {
  OracleStatisticsCommand,
  OracleStatisticsDto,
} from './model/oracle-statistics.model';
import {
  UserStatisticsCommand,
  UserStatisticsDto,
} from './model/user-statistics.model';

@Injectable()
export class StatisticsProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        OracleStatisticsDto,
        OracleStatisticsCommand,
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        UserStatisticsDto,
        UserStatisticsCommand,
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
    };
  }
}
