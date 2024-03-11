import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import {
  CamelCaseNamingConvention,
  createMap,
  forMember,
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
} from './interfaces/job-assignment.interface';

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
          mapWith(JobsFetchParams, JobsFetchParamsDto, (source) => source),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
    };
  }
}
