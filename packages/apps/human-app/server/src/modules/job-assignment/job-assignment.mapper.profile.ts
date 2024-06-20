import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import {
  CamelCaseNamingConvention,
  createMap,
  forMember,
  mapFrom,
  Mapper,
  mapWith,
  namingConventions,
  SnakeCaseNamingConvention,
} from '@automapper/core';
import {
  JobAssignmentCommand,
  JobAssignmentDto,
  JobAssignmentParams,
  JobsFetchParams,
  JobsFetchParamsCommand,
  JobsFetchParamsDto,
  ResignJobCommand,
  ResignJobDto,
} from './model/job-assignment.model';

@Injectable()
export class JobAssignmentProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        JobAssignmentDto,
        JobAssignmentParams,
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        JobAssignmentDto,
        JobAssignmentCommand,
        forMember(
          (destination) => destination.data,
          mapWith(JobAssignmentParams, JobAssignmentDto, (source) => source),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        JobsFetchParamsDto,
        JobsFetchParams,
        // forMember usage cause: https://github.com/nartc/mapper/issues/583
        forMember(
          (destination) => destination.pageSize,
          mapFrom((source: JobsFetchParamsDto) => source.page_size),
        ),
        forMember(
          (destination) => destination.sortField,
          mapFrom((source: JobsFetchParamsDto) => source.sort_field),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        JobsFetchParamsDto,
        JobsFetchParamsCommand,
        forMember(
          (destination) => destination.data,
          mapFrom((source: JobsFetchParamsDto) =>
            mapper.map(source, JobsFetchParamsDto, JobsFetchParams),
          ),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        ResignJobDto,
        ResignJobCommand,
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
    };
  }
}
