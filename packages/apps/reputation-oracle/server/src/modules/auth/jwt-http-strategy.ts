import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Req, UnauthorizedException } from '@nestjs/common';

import {
  JWT_STRATEGY_NAME,
  LOGOUT_PATH,
  RESEND_EMAIL_VERIFICATION_PATH,
} from '../../common/constants';
import { UserEntity, UserStatus, UserRepository } from '../user';
import { AuthConfigService } from '../../config/auth-config.service';
import { TokenRepository } from './token.repository';
import { TokenType } from './token.entity';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(
  Strategy,
  JWT_STRATEGY_NAME,
) {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: TokenRepository,
    authConfigService: AuthConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfigService.jwtPublicKey,
      passReqToCallback: true,
    });
  }

  async validate(
    @Req() request: any,
    payload: { userId: number },
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOneById(payload.userId, {
      relations: {
        kyc: true,
        siteKeys: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (
      user.status !== UserStatus.ACTIVE &&
      request.url !== RESEND_EMAIL_VERIFICATION_PATH &&
      request.url !== LOGOUT_PATH
    ) {
      throw new UnauthorizedException('User not active');
    }

    const token = await this.tokenRepository.findOneByUserIdAndType(
      user.id,
      TokenType.REFRESH,
    );

    if (!token) {
      throw new UnauthorizedException('User is not authorized');
    }

    return user;
  }
}
