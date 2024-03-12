import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import {
  CamelCaseNamingConvention,
  createMap,
  forMember, mapFrom,
  Mapper,
  mapWith,
  namingConventions,
  SnakeCaseNamingConvention,
} from '@automapper/core';
import {
  JobsDiscoveryParams,
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsDto,
} from './interfaces/jobs-discovery.interface';

@Injectable()
export class JobsDiscoveryProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        JobsDiscoveryParamsDto,
        JobsDiscoveryParams,
        forMember(
          destination => destination.pageSize,
          mapFrom(source => source.page_size),
        ),
        forMember(
          destination => destination.sortField,
          mapFrom(source => source.sort_field),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        JobsDiscoveryParamsDto,
        JobsDiscoveryParamsCommand,
        forMember(
          (destination) => destination.data,
          mapWith(JobsDiscoveryParams, JobsDiscoveryParamsDto, (source) => source),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
    };
  }
}
