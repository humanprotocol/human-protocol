import { Injectable } from '@nestjs/common';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, Mapper, mapWith } from '@automapper/core';
import {
  EmailVerificationCommand,
  EmailVerificationData,
  EmailVerificationDto,
} from './model/email-verification.model';
import {
  ResendEmailVerificationCommand,
  ResendEmailVerificationData,
  ResendEmailVerificationDto,
  ResendEmailVerificationParams,
} from './model/resend-email-verification.model';

@Injectable()
export class EmailConfirmationProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, EmailVerificationDto, EmailVerificationCommand);
      createMap(mapper, EmailVerificationCommand, EmailVerificationData);

      createMap(
        mapper,
        ResendEmailVerificationDto,
        ResendEmailVerificationCommand,
        forMember(
          (destination) => destination.data,
          mapWith(
            ResendEmailVerificationParams,
            ResendEmailVerificationDto,
            (source) => source,
          ),
        ),
      );
      createMap(
        mapper,
        ResendEmailVerificationDto,
        ResendEmailVerificationParams,
      );
      createMap(
        mapper,
        ResendEmailVerificationParams,
        ResendEmailVerificationData,
      );
    };
  }
}