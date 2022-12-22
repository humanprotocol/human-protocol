import { Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, FindConditions, Repository } from "typeorm";
import { v4 } from "uuid";

import { UserEntity } from "../user/user.entity";
import { UserService } from "../user/user.service";
import { IUserCreateDto } from "../user/interfaces";
import { TokenService } from "../token/token.service";
import { AuthEntity } from "./auth.entity";
import {
  IEmailVerificationDto,
  IForgotPasswordDto,
  ISignInDto,
  IResendEmailVerificationDto,
  IRestorePasswordDto,
} from "./interfaces";
import { IJwt } from "../common/jwt";
import { TokenType } from "../token/token.entity";
import { UserStatus } from "../common/decorators";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    @InjectRepository(AuthEntity)
    private readonly authEntityRepository: Repository<AuthEntity>,
  ) {}

  public async signin(data: ISignInDto, ip: string): Promise<IJwt> {
    const userEntity = await this.userService.getByCredentials(data.email, data.password);

    if (!userEntity) {
      throw new NotFoundException("User not found");
    }

    return this.auth(userEntity, ip);
  }

  public async signup(data: IUserCreateDto): Promise<UserEntity> {
    const userEntity = await this.userService.create(data);

    const tokenEntity = await this.tokenService.getToken(TokenType.EMAIL, userEntity);

    this.logger.debug("Verification token: ", tokenEntity.uuid);

    // TODO: Add mail provider

    return userEntity;
  }

  public async logout(where: FindConditions<AuthEntity>): Promise<DeleteResult> {
    return this.authEntityRepository.delete(where);
  }

  public async refresh(where: FindConditions<AuthEntity>, ip: string): Promise<IJwt> {
    const authEntity = await this.authEntityRepository.findOne({ where, relations: ["user"] });

    if (!authEntity || authEntity.refreshTokenExpiresAt < new Date().getTime()) {
      throw new UnauthorizedException("Refresh token has expired");
    }

    if (authEntity.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("User not active");
    }

    return this.auth(authEntity.user, ip);
  }

  public async auth(userEntity: UserEntity, ip: string): Promise<IJwt> {
    const refreshToken = v4();
    const date = new Date();

    const accessTokenExpiresIn = ~~this.configService.get<number>("JWT_ACCESS_TOKEN_EXPIRES_IN", 5 * 60);
    const refreshTokenExpiresIn = ~~this.configService.get<number>("JWT_REFRESH_TOKEN_EXPIRES_IN", 30 * 24 * 60 * 60);

    await this.authEntityRepository
      .create({
        user: userEntity,
        refreshToken,
        refreshTokenExpiresAt: date.getTime() + refreshTokenExpiresIn * 1000,
        ip,
      })
      .save();

    return {
      accessToken: this.jwtService.sign({ email: userEntity.email }, { expiresIn: accessTokenExpiresIn }),
      refreshToken: refreshToken,
      accessTokenExpiresAt: date.getTime() + accessTokenExpiresIn * 1000,
      refreshTokenExpiresAt: date.getTime() + refreshTokenExpiresIn * 1000,
    };
  }

  public async forgotPassword(data: IForgotPasswordDto): Promise<void> {
    const userEntity = await this.userService.findOne({ email: data.email });

    if (!userEntity) return;

    if (userEntity.status !== UserStatus.ACTIVE) throw new UnauthorizedException("User is not active");

    const tokenEntity = await this.tokenService.getToken(TokenType.PASSWORD, userEntity);

    // Add mail provider

    this.logger.debug("Verification token: ", tokenEntity.uuid);
  }

  public async restorePassword(data: IRestorePasswordDto): Promise<void> {
    const tokenEntity = await this.tokenService.findOne({ uuid: data.token, tokenType: TokenType.PASSWORD });

    if (!tokenEntity) {
      throw new NotFoundException("Token not found");
    }

    await this.userService.updatePassword(tokenEntity.user, data);

    // Add mail provider

    this.logger.debug("Verification token: ", tokenEntity.uuid);

    await tokenEntity.remove();
  }

  public async emailVerification(data: IEmailVerificationDto, ip: string): Promise<IJwt> {
    const tokenEntity = await this.tokenService.findOne({ uuid: data.token, tokenType: TokenType.EMAIL });

    if (!tokenEntity) {
      throw new NotFoundException("Token not found");
    }

    await this.userService.activate(tokenEntity.user);

    await tokenEntity.remove();

    return this.auth(tokenEntity.user, ip);
  }

  public async resendEmailVerification(data: IResendEmailVerificationDto): Promise<void> {
    const userEntity = await this.userService.findOne({ email: data.email });

    if (!userEntity) return;

    const tokenEntity = await this.tokenService.getToken(TokenType.EMAIL, userEntity);

    // Add mail provider

    this.logger.debug("Verification token: ", tokenEntity.uuid);
  }
}
