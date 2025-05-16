import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Req, UnauthorizedException } from '@nestjs/common';

import {
  JWT_STRATEGY_NAME,
  LOGOUT_PATH,
  RESEND_EMAIL_VERIFICATION_PATH,
} from '../../common/constants';
import { UserRole, UserStatus } from '../user';
import { AuthConfigService } from '../../config';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(
  Strategy,
  JWT_STRATEGY_NAME,
) {
  constructor(authConfigService: AuthConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfigService.jwtPublicKey,
      passReqToCallback: true,
    });
  }

  async validate(
    @Req() request: any,
    payload: { user_id: number; status: UserStatus; role: UserRole },
  ): Promise<{ id: number; role: UserRole }> {
    if (
      payload.status !== UserStatus.ACTIVE &&
      request.url !== RESEND_EMAIL_VERIFICATION_PATH &&
      request.url !== LOGOUT_PATH
    ) {
      throw new UnauthorizedException('User not active');
    }

    return { id: payload.user_id, role: payload.role };
  }
}
