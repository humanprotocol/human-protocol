import {
  CamelCaseNamingConvention,
  createMap,
  forMember,
  mapFrom,
  Mapper,
  namingConventions,
  SnakeCaseNamingConvention,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import {
  GetJobsCommand,
  GetJobsParams,
  GetJobsQueryDto,
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
        GetJobsQueryDto,
        GetJobsParams,
        // forMember usage cause: https://github.com/nartc/mapper/issues/583
        forMember(
          (destination) => destination.pageSize,
          mapFrom((source) => source.page_size),
        ),
        forMember(
          (destination) => destination.sortField,
          mapFrom((source) => source.sort_field),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        GetJobsQueryDto,
        GetJobsCommand,
        forMember(
          (destination) => destination.data,
          mapFrom((source: GetJobsQueryDto) =>
            mapper.map(source, GetJobsQueryDto, GetJobsParams),
          ),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
    };
  }
}
