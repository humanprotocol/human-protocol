import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { createMap, Mapper } from '@automapper/core';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsData,
  JobsDiscoveryParamsDto,
} from './interfaces/jobs-discovery.interface';

@Injectable()
export class JobsDiscoveryProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, JobsDiscoveryParamsDto, JobsDiscoveryParamsCommand);
      createMap(mapper, JobsDiscoveryParamsCommand, JobsDiscoveryParamsData);
    };
  }
}
