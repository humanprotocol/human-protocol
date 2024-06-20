import { Injectable } from '@nestjs/common';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import {
  CamelCaseNamingConvention,
  createMap,
  forMember,
  mapFrom,
  Mapper,
  namingConventions,
  SnakeCaseNamingConvention,
} from '@automapper/core';
import { JwtUserData } from '../../common/interfaces/jwt-token.model';
import { EnableLabelingCommand } from './model/enable-labeling.model';
import { DailyHmtSpentCommand } from './model/daily-hmt-spent.model';
import { UserStatsCommand } from './model/user-stats.model';
import { VerifyTokenCommand } from './model/verify-token.model';

@Injectable()
export class HCaptchaMapperProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }
  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, JwtUserData, EnableLabelingCommand);
      createMap(
        mapper,
        JwtUserData,
        DailyHmtSpentCommand,
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        JwtUserData,
        UserStatsCommand,
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        JwtUserData,
        VerifyTokenCommand,
        forMember(
          (destination) => destination.sitekey,
          mapFrom((source) => source.site_key),
        ),
        forMember(
          (destination) => destination.secret,
          mapFrom((source) => source.address),
        ),
      );
    };
  }
}
