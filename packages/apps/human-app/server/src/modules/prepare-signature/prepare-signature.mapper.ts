import { Injectable } from '@nestjs/common';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, Mapper } from '@automapper/core';
import {
  PrepareSignatureCommand,
  PrepareSignatureData,
  PrepareSignatureDto,
} from './model/prepare-signature.model';

@Injectable()
export class PrepareSignatureProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, PrepareSignatureDto, PrepareSignatureCommand);
      createMap(mapper, PrepareSignatureCommand, PrepareSignatureData);
    };
  }
}
