import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpStatus, Injectable, Req } from '@nestjs/common';

import { UserEntity } from '../../user/user.entity';
import {
  LOGOUT_PATH,
  RESEND_EMAIL_VERIFICATION_PATH,
} from '../../../common/constants';
import { UserStatus } from '../../../common/enums/user';
import { UserRepository } from '../../user/user.repository';
import { AuthConfigService } from '../../../common/config/auth-config.service';
import { ControlledError } from '../../../common/errors/controlled';
import { TokenRepository } from '../token.repository';
import { TokenType } from '../token.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, 'jwt-http') {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly authConfigService: AuthConfigService,
    private readonly jwtService: JwtService,
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
      throw new ControlledError('User not found', HttpStatus.UNAUTHORIZED);
    }

    if (
      user.status !== UserStatus.ACTIVE &&
      request.url !== RESEND_EMAIL_VERIFICATION_PATH &&
      request.url !== LOGOUT_PATH
    ) {
      throw new ControlledError('User not active', HttpStatus.UNAUTHORIZED);
    }

    const token = await this.tokenRepository.findOneByUserIdAndType(
      user.id,
      TokenType.REFRESH,
    );

    if (!token) {
      throw new ControlledError(
        'User is not authorized',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // TODO: Remove prefix
    const jwt =
      'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN0cmluZ0BobXQuYWkiLCJ1c2VySWQiOjMsImFkZHJlc3MiOiIweDI2RTdFZjJEMDU3OTNjNkQ0N2M2NzhmMUY0QjI0Njg1NjIzNkYwODkiLCJyZXB1dGF0aW9uX25ldHdvcmsiOiIweDQ3MDgzNTQyMTM0NTNhZjBjZEMzM2ViNzVkOTRmQkMwMDA0NTg0MUUiLCJpYXQiOjE3MTY0NjYwMTMsImV4cCI6MTcxNjQ2OTYxM30.uUGClyAq4sbzbWDnsu77zpOeaaX0O_V0FIVPSBMJR-teZOilHCtfCZk0yu_MusZ7CpFZiMafICEXYGYhYEQqug'; //request.headers.authorization;

    const jwtData = await this.jwtService.decode(jwt);

    if (
      (user.evmAddress && user.evmAddress !== jwtData.address) ||
      (!user.evmAddress && jwtData.address)
    ) {
      throw new ControlledError(
        'User has invalid jwt data',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
