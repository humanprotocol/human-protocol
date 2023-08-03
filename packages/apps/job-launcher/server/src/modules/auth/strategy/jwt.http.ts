import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserEntity } from '../../user/user.entity';
import { UserStatus } from '../../../common/enums/user';
import { ConfigNames } from '../../../common/config';
import { AuthService } from '../auth.service';
import { AuthStatus } from '../../../common/enums/auth';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, 'jwt-http') {
  constructor(
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
    });
  }

  public async validate(payload: {
    refreshToken: string;
    email: string;
  }): Promise<UserEntity> {
    const refreshToken = payload.refreshToken.toLowerCase();
    const authEntity = await this.authService.getByRefreshToken(refreshToken);

    if (!authEntity?.user) {
      throw new NotFoundException('User not found');
    }

    if (authEntity?.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not active');
    }

    if (authEntity.status !== AuthStatus.ACTIVE) {
      throw new UnauthorizedException('Token expired');
    }

    return authEntity?.user;
  }
}
