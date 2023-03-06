import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { UserEntity } from "../../user/user.entity";
import { UserService } from "../../user/user.service";
import { UserStatus } from "../../common/decorators";

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, "jwt-http") {
  constructor(private readonly userService: UserService, private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET", "secretkey"),
    });
  }

  public async validate(payload: { email: string }): Promise<UserEntity> {
    const email = payload.email.toLowerCase();
    const userEntity = await this.userService.findOne({ email });

    if (!userEntity) {
      throw new NotFoundException("User not found");
    }

    if (userEntity.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("User not active");
    }

    return userEntity;
  }
}
