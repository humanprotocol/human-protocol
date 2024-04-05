import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Req, UnauthorizedException } from '@nestjs/common';

import { UserEntity } from '../../user/user.entity';
import { RESEND_EMAIL_VERIFICATION_PATH } from '../../../common/constants';
import { UserStatus } from '../../../common/enums/user';
import { UserRepository } from '../../user/user.repository';
import { AuthConfigService } from '../../../common/config/auth-config.service';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, 'jwt-http') {
  constructor(
    private readonly userRepository: UserRepository,
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
      throw new UnauthorizedException('User not found');
    }

    if (
      user.status !== UserStatus.ACTIVE &&
      request.url !== RESEND_EMAIL_VERIFICATION_PATH
    ) {
      throw new UnauthorizedException('User not active');
    }

    return user;
  }
}
