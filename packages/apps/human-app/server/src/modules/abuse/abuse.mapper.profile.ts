import {
  CamelCaseNamingConvention,
  createMap,
  forMember,
  Mapper,
  mapWith,
  namingConventions,
  SnakeCaseNamingConvention,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import {
  ReportAbuseCommand,
  ReportAbuseData,
  ReportAbuseDto,
  ReportAbuseParams,
} from './model/abuse.model';

@Injectable()
export class AbuseProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        ReportAbuseDto,
        ReportAbuseParams,
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        ReportAbuseDto,
        ReportAbuseCommand,
        forMember(
          (destination) => destination.data,
          mapWith(ReportAbuseParams, ReportAbuseDto, (source) => source),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        ReportAbuseParams,
        ReportAbuseData,
        namingConventions({
          source: new CamelCaseNamingConvention(),
          destination: new SnakeCaseNamingConvention(),
        }),
      );
    };
  }
}
