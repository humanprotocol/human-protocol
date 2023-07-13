import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DeleteResult, FindOptionsWhere, Repository } from 'typeorm';
import { v4 } from 'uuid';

import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthEntity } from './auth.entity';
import { TokenType } from './token.entity';
import { UserStatus } from '../../common/enums/user';
import { UserCreateDto } from '../user/user.dto';
import {
  ForgotPasswordDto,
  ResendEmailVerificationDto,
  RestorePasswordDto,
  SignInDto,
  VerifyEmailDto,
} from './auth.dto';
import { TokenRepository } from './token.repository';
import { AuthRepository } from './auth.repository';
import { ErrorAuth } from '../../common/constants/errors';
import { ConfigNames } from '../../common/config';
import { IJwt } from '../../common/interfaces/auth';
import { IResponseBool } from 'src/common/interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly tokenRepository: TokenRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  public async signin(data: SignInDto, ip: string): Promise<IJwt> {
    const userEntity = await this.userService.getByCredentials(
      data.email,
      data.password,
    );

    if (!userEntity) {
      throw new NotFoundException(ErrorAuth.InvalidEmailOrPassword);
    }

    return this.auth(userEntity, ip);
  }

  public async signup(data: UserCreateDto): Promise<UserEntity> {
    const userEntity = await this.userService.create(data);

    const tokenEntity = await this.tokenRepository.create({
      tokenType: TokenType.EMAIL,
      user: userEntity,
    });

    this.logger.debug('Verification token: ', tokenEntity.uuid);

    // TODO: Add mail provider

    return userEntity;
  }

  public async logout(
    where: FindOptionsWhere<AuthEntity>,
  ): Promise<DeleteResult> {
    return this.authRepository.delete(where);
  }

  public async refresh(
    where: FindOptionsWhere<AuthEntity>,
    ip: string,
  ): Promise<IJwt> {
    const authEntity = await this.authRepository.findOne(where, {
      relations: ['user'],
    });

    if (
      !authEntity ||
      authEntity.refreshTokenExpiresAt < new Date().getTime()
    ) {
      throw new UnauthorizedException(ErrorAuth.RefreshTokenHasExpired);
    }

    if (authEntity.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(ErrorAuth.UserNotActive);
    }

    return this.auth(authEntity.user, ip);
  }

  public async auth(userEntity: UserEntity, ip: string): Promise<IJwt> {
    const refreshToken = v4();
    const date = new Date();

    const accessTokenExpiresIn = ~~this.configService.get<number>(ConfigNames.JWT_ACCESS_TOKEN_EXPIRES_IN)!;
    const refreshTokenExpiresIn = ~~this.configService.get<number>(ConfigNames.JWT_REFRESH_TOKEN_EXPIRES_IN)!;

    await this.authRepository.create({
      user: userEntity,
      refreshToken,
      refreshTokenExpiresAt: date.getTime() + refreshTokenExpiresIn * 1000,
      ip,
    });

    return {
      accessToken: this.jwtService.sign(
        { email: userEntity.email },
        { expiresIn: accessTokenExpiresIn },
      ),
      refreshToken: refreshToken,
      accessTokenExpiresAt: date.getTime() + accessTokenExpiresIn * 1000,
      refreshTokenExpiresAt: date.getTime() + refreshTokenExpiresIn * 1000,
    };
  }

  public async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    const userEntity = await this.userService.getByEmail(data.email);

    if (!userEntity) return;

    if (userEntity.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException(ErrorAuth.UserNotActive);

    const tokenEntity = await this.tokenRepository.create({
      tokenType: TokenType.PASSWORD,
      user: userEntity,
    });

    // Add mail provider

    this.logger.debug('Verification token: ', tokenEntity.uuid);
  }

  public async restorePassword(data: RestorePasswordDto): Promise<IResponseBool> {
    const tokenEntity = await this.tokenRepository.findOne({
      uuid: data.token,
      tokenType: TokenType.PASSWORD,
    });

    if (!tokenEntity) {
      throw new NotFoundException('Token not found');
    }

    await this.userService.updatePassword(tokenEntity.user, data);

    // Add mail provider

    this.logger.debug('Verification token: ', tokenEntity.uuid);

    await tokenEntity.remove();

    return {
      response: true
    }
  }

  public async emailVerification(
    data: VerifyEmailDto,
    ip: string,
  ): Promise<IJwt> {
    const tokenEntity = await this.tokenRepository.findOne({
      uuid: data.token,
      tokenType: TokenType.EMAIL,
    });

    if (!tokenEntity) {
      throw new NotFoundException('Token not found');
    }

    await this.userService.activate(tokenEntity.user);

    await tokenEntity.remove();

    return this.auth(tokenEntity.user, ip);
  }

  public async resendEmailVerification(
    data: ResendEmailVerificationDto,
  ): Promise<void> {
    const userEntity = await this.userService.getByEmail(data.email);

    if (!userEntity) return;

    const tokenEntity = await this.tokenRepository.create({
      tokenType: TokenType.EMAIL,
      user: userEntity,
    });

    // Add mail provider

    this.logger.debug('Verification token: ', tokenEntity.uuid);
  }
}
