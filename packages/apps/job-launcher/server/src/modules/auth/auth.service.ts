import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';

import { IJwt } from 'src/common/interfaces';
import { ErrorAuth } from '../../common/constants/errors';
import { UserStatus } from '../../common/enums/user';
import { UserCreateDto } from '../user/user.dto';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import {
  ForgotPasswordDto,
  ResendEmailVerificationDto,
  RestorePasswordDto,
  SignInDto,
  VerifyEmailDto,
} from './auth.dto';
import { TokenType } from './token.entity';
import { TokenRepository } from './token.repository';
import { AuthRepository } from './auth.repository';
import { AuthStatus } from 'src/common/enums/auth';
import { AuthEntity } from './auth.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  public async signin(data: SignInDto): Promise<IJwt> {
    const userEntity = await this.userService.getByCredentials(
      data.email,
      data.password,
    );

    if (!userEntity) {
      throw new NotFoundException(ErrorAuth.InvalidEmailOrPassword);
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

    // TODO: Add mail provider

    return userEntity;
  }

  public async logout(user: UserEntity): Promise<void> {
    await this.authRepository.update(
      { userId: user.id, status: AuthStatus.ACTIVE },
      { status: AuthStatus.EXPIRED },
    );
    return;
  }

  public async auth(userEntity: UserEntity): Promise<IJwt> {
    const tokenId = v4();

    await this.authRepository.create({
      user: userEntity,
      tokenId,
      status: AuthStatus.ACTIVE,
    });

    return {
      accessToken: this.jwtService.sign({
        tokenId: tokenId,
        email: userEntity.email,
      }),
    };
  }

  public async getByTokenId(tokenId: string): Promise<AuthEntity | null> {
    return this.authRepository.findOne({ tokenId });
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

  public async restorePassword(data: RestorePasswordDto): Promise<boolean> {
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

    return true;
  }

  public async emailVerification(data: VerifyEmailDto): Promise<IJwt> {
    const tokenEntity = await this.tokenRepository.findOne({
      uuid: data.token,
      tokenType: TokenType.EMAIL,
    });

    if (!tokenEntity) {
      throw new NotFoundException('Token not found');
    }

    await this.userService.activate(tokenEntity.user);

    await tokenEntity.remove();

    return this.auth(tokenEntity.user);
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
