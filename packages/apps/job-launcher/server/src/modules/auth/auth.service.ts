import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ErrorAuth } from '../../common/constants/errors';
import { UserStatus } from '../../common/enums/user';
import { UserCreateDto } from '../user/user.dto';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import {
  AuthDto,
  ForgotPasswordDto,
  ResendEmailVerificationDto,
  RestorePasswordDto,
  SignInDto,
  VerifyEmailDto,
} from './auth.dto';
import { TokenType } from './token.entity';
import { TokenRepository } from './token.repository';
import { AuthRepository } from './auth.repository';
import { ConfigNames } from '../../common/config';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { SendGridService } from '../sendgrid/sendgrid.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenExpiresIn: string;
  private readonly salt: string;
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly sendgridService: SendGridService,
  ) {
    this.refreshTokenExpiresIn = configService.get<string>(
      ConfigNames.JWT_REFRESH_TOKEN_EXPIRES_IN,
      '100000000',
    );

    this.salt = randomBytes(16).toString('hex');
  }

  public async signin(data: SignInDto): Promise<AuthDto> {
    const userEntity = await this.userService.getByCredentials(
      data.email,
      data.password,
    );

    if (!userEntity) {
      throw new NotFoundException(ErrorAuth.InvalidEmailOrPassword);
    }

    if (userEntity.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(ErrorAuth.UserNotActive);
    }

    return this.auth(userEntity);
  }

  public async signup(data: UserCreateDto): Promise<UserEntity> {
    const userEntity = await this.userService.create(data);

    const tokenEntity = await this.tokenRepository.create({
      tokenType: TokenType.EMAIL,
      user: userEntity,
    });

    this.logger.debug('Verification token: ', tokenEntity.uuid);

    this.sendgridService.send({
      to: data.email,
      subject: 'Verify your email',
      text: `Verify your email: ${tokenEntity.uuid}`,
    });

    return userEntity;
  }

  public async logout(user: UserEntity): Promise<void> {
    await this.authRepository.delete({ userId: user.id });
  }

  public async auth(userEntity: UserEntity): Promise<AuthDto> {
    const auth = await this.authRepository.findOne({ userId: userEntity.id });

    const accessToken = await this.jwtService.signAsync({
      email: userEntity.email,
      userId: userEntity.id,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        email: userEntity.email,
        userId: userEntity.id,
      },
      {
        expiresIn: this.refreshTokenExpiresIn,
      },
    );

    const accessTokenHashed = this.hashToken(accessToken);
    const refreshTokenHashed = this.hashToken(refreshToken);

    if (auth) {
      await this.logout(userEntity);
    }

    await this.authRepository.create({
      user: userEntity,
      refreshToken: refreshTokenHashed,
      accessToken: accessTokenHashed,
    });

    return { accessToken, refreshToken };
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

    this.sendgridService.send({
      to: data.email,
      subject: 'Reset password',
      text: `Reset password: ${tokenEntity.uuid}`,
    });

    this.logger.debug('Verification token: ', tokenEntity.uuid);
  }

  public async restorePassword(data: RestorePasswordDto): Promise<boolean> {
    const tokenEntity = await this.tokenRepository.findOne({
      uuid: data.token,
      tokenType: TokenType.PASSWORD,
    });

    if (!tokenEntity) {
      throw new NotFoundException('Token not found');
    }

    await this.userService.updatePassword(tokenEntity.user, data);

    this.sendgridService.send({
      to: tokenEntity.user.email,
      subject: 'Password changed',
      text: 'Password changed',
    });

    this.logger.debug('Verification token: ', tokenEntity.uuid);

    await tokenEntity.remove();

    return true;
  }

  public async emailVerification(data: VerifyEmailDto): Promise<void> {
    const tokenEntity = await this.tokenRepository.findOne({
      uuid: data.token,
      tokenType: TokenType.EMAIL,
    });

    if (!tokenEntity) {
      throw new NotFoundException('Token not found');
    }

    this.userService.activate(tokenEntity.user);
    await tokenEntity.remove();
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

    this.sendgridService.send({
      to: data.email,
      subject: 'Verify your email',
      text: `Verify your email: ${tokenEntity.uuid}`,
    });

    this.logger.debug('Verification token: ', tokenEntity.uuid);
  }

  public hashToken(token: string): string {
    const hash = createHash('sha256');
    hash.update(token + this.salt);
    return hash.digest('hex');
  }

  public compareToken(token: string, hashedToken: string): boolean {
    return this.hashToken(token) === hashedToken;
  }
}
