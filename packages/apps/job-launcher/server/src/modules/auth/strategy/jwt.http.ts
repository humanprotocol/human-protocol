import { Injectable, Req } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthConfigService } from '../../../common/config/auth-config.service';
import {
  LOGOUT_PATH,
  RESEND_EMAIL_VERIFICATION_PATH,
} from '../../../common/constants';
import { UserStatus } from '../../../common/enums/user';
import { AuthError } from '../../../common/errors';
import { UserEntity } from '../../user/user.entity';
import { UserRepository } from '../../user/user.repository';
import { TokenType } from '../token.entity';
import { TokenRepository } from '../token.repository';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, 'jwt-http') {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly authConfigService: AuthConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfigService.jwtPublicKey,
      passReqToCallback: true,
    });
  }

  public async validate(
    @Req() request: any,
    payload: { userId: number },
  ): Promise<UserEntity> {
    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      throw new AuthError('User not found');
    }

    if (
      user.status !== UserStatus.ACTIVE &&
      request.url !== RESEND_EMAIL_VERIFICATION_PATH &&
      request.url !== LOGOUT_PATH
    ) {
      throw new AuthError('User not active');
    }

    const token = await this.tokenRepository.findOneByUserIdAndType(
      user.id,
      TokenType.REFRESH,
    );

    if (!token) {
      throw new AuthError('User is not authorized');
    }

    return user;
  }
}
