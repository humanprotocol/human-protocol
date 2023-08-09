import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserEntity } from '../../user/user.entity';
import { UserStatus } from '../../../common/enums/user';
import { ConfigNames } from '../../../common/config';
import { AuthRepository } from '../auth.repository';
import { AuthService } from '../auth.service';
import { JWT_PREFIX } from '../../../common/constants';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, 'jwt-http') {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
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
    const auth = await this.authRepository.findOne(
      {
        userId: payload.userId,
      },
      {
        relations: ['user'],
      },
    );

    if (!auth?.user) {
      throw new UnauthorizedException('User not found');
    }

    if (auth?.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not active');
    }

    //check that the jwt exists in the database
    let jwt = request.headers['authorization'] as string;
    if (jwt.toLowerCase().substring(0, JWT_PREFIX.length) === JWT_PREFIX) {
      jwt = jwt.substring(JWT_PREFIX.length);
    }
    if (request.url === '/auth/refresh') {
      if (!this.authService.compareToken(jwt, auth?.refreshToken)) {
        throw new UnauthorizedException('Token expired');
      }
    } else {
      if (!this.authService.compareToken(jwt, auth?.accessToken)) {
        throw new UnauthorizedException('Token expired');
      }
    }

    return auth?.user;
  }
}
