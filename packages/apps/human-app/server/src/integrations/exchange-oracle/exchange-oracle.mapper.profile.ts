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
  JobAssignmentData,
  JobAssignmentParams,
  JobsFetchParams,
  JobsFetchParamsData,
  ResignJobCommand,
  ResignJobData,
} from '../../modules/job-assignment/model/job-assignment.model';
import {
  JobsDiscoveryParams,
  JobsDiscoveryParamsData,
} from '../../modules/jobs-discovery/model/jobs-discovery.model';

@Injectable()
export class ExchangeOracleProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        JobAssignmentParams,
        JobAssignmentData,
        namingConventions({
          source: new CamelCaseNamingConvention(),
          destination: new SnakeCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        JobsFetchParams,
        JobsFetchParamsData,
        namingConventions({
          source: new CamelCaseNamingConvention(),
          destination: new SnakeCaseNamingConvention(),
        }),
        // forMember usage cause: https://github.com/nartc/mapper/issues/583
        forMember(
          (destination) => destination.page_size,
          mapFrom((source) => source.pageSize),
        ),
        forMember(
          (destination) => destination.sort_field,
          mapFrom((source) => source.sortField),
        ),
      );
      createMap(
        mapper,
        JobsDiscoveryParams,
        JobsDiscoveryParamsData,
        // Automapper has problem with mapping arrays, thus explicit conversion
        forMember(
          (destination) => destination.fields,
          mapFrom((source) => source.fields),
        ),
        namingConventions({
          source: new CamelCaseNamingConvention(),
          destination: new SnakeCaseNamingConvention(),
        }),
        forMember(
          (destination) => destination.page_size,
          mapFrom((source) => source.pageSize),
        ),
        forMember(
          (destination) => destination.sort_field,
          mapFrom((source) => source.sortField),
        ),
      );
      createMap(
        mapper,
        ResignJobCommand,
        ResignJobData,
        namingConventions({
          source: new CamelCaseNamingConvention(),
          destination: new SnakeCaseNamingConvention(),
        }),
      );
    };
  }
}
