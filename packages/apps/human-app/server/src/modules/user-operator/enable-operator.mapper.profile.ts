import { Injectable } from '@nestjs/common';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, Mapper, mapWith } from '@automapper/core';
import {
  EnableOperatorCommand,
  EnableOperatorData,
  EnableOperatorDto,
  EnableOperatorParams,
} from '../user-operator/model/enable-operator.model';

@Injectable()
export class EnableOperatorProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        EnableOperatorDto,
        EnableOperatorCommand,
        forMember(
          (destination) => destination.data,
          mapWith(EnableOperatorParams, EnableOperatorDto, (source) => source),
        ),
      );
      createMap(mapper, EnableOperatorDto, EnableOperatorParams);
      createMap(mapper, EnableOperatorParams, EnableOperatorData);
    };
  }
}
