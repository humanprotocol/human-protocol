import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserEntity } from '../../user/user.entity';
import { RESEND_EMAIL_VERIFICATION_PATH } from '../../../common/constants';
import { UserStatus } from '../../../common/enums/user';
import { ConfigNames } from '../../../common/config';
import { UserRepository } from '../../user/user.repository';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, 'jwt-http') {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(ConfigNames.JWT_PUBLIC_KEY, ''),
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
