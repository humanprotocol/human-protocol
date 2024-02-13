import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserEntity } from '../../user/user.entity';
import { UserStatus } from '../../../common/enums/user';
import { ConfigNames } from '../../../common/config';
import { JWT_PREFIX } from '../../../common/constants';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, 'jwt-http') {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        ConfigNames.JWT_SECRET,
        'secretkey',
      ),
      passReqToCallback: true,
    });
  }

  public async validate(
    @Req() request: any,
    payload: { email: string; userId: number },
  ): Promise<UserEntity> {
    const auth = await this.authRepository.findOneByUserId(payload.userId);

    if (!auth?.user) {
      throw new UnauthorizedException('User not found');
    }

    if (
      auth?.user.status !== UserStatus.ACTIVE &&
      request.url !== '/auth/resend-email-verification'
    ) {
      throw new UnauthorizedException('User not active');
    }

    //check that the jwt exists in the database
    let jwt = request.headers['authorization'] as string;
    if (jwt.toLowerCase().substring(0, JWT_PREFIX.length) === JWT_PREFIX) {
      jwt = jwt.substring(JWT_PREFIX.length);
    }

    const decodedJwt = this.jwtService.decode(jwt);
    if (request.url === '/auth/refresh') {
      if (decodedJwt.jti !== auth?.refreshJwtId) {
        throw new UnauthorizedException('Invalid token');
      }
    } else {
      if (decodedJwt.jti !== auth?.accessJwtId) {
        throw new UnauthorizedException('Invalid token');
      }
    }

    return auth?.user;
  }
}
