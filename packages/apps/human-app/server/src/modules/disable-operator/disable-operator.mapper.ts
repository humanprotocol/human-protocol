import { Injectable } from '@nestjs/common';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, Mapper, mapWith } from '@automapper/core';
import {
  DisableOperatorCommand,
  DisableOperatorData,
  DisableOperatorDto,
  DisableOperatorParams,
} from './model/disable-operator.model';

@Injectable()
export class DisableOperatorProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        DisableOperatorDto,
        DisableOperatorCommand,
        forMember(
          (destination) => destination.data,
          mapWith(
            DisableOperatorParams,
            DisableOperatorDto,
            (source) => source,
          ),
        ),
      );
      createMap(mapper, DisableOperatorDto, DisableOperatorParams);
      createMap(mapper, DisableOperatorParams, DisableOperatorData);
    };
  }
}
