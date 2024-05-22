import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
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
  JobsDiscoveryParams,
  JobsDiscoveryParamsCommand, JobsDiscoveryParamsDetails,
  JobsDiscoveryParamsDto,
} from './model/jobs-discovery.model';

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
        // forMember usage cause: https://github.com/nartc/mapper/issues/583
        forMember(
          (destination) => destination.pageSize,
          mapFrom((source) => source.page_size),
        ),
        forMember(
          (destination) => destination.sortField,
          mapFrom((source) => source.sort_field),
        ),
        // Automapper has problem with mapping arrays, thus explicit conversion
        forMember(
          (destination) => destination.fields,
          mapFrom((source) => source.fields),
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
          mapFrom((source: JobsDiscoveryParamsDto) =>
            mapper.map(source, JobsDiscoveryParamsDto, JobsDiscoveryParams),
          ),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(mapper, JobsDiscoveryParamsCommand, JobsDiscoveryParamsDetails);
    };
  }
}
