import { KVStoreKeys, KVStoreUtils, Role } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { SignatureType } from '../../common/enums/web3';
import { AuthConfigService } from '../../config/auth-config.service';
import { NDAConfigService } from '../../config/nda-config.service';
import { ServerConfigService } from '../../config/server-config.service';
import { Web3ConfigService } from '../../config/web3-config.service';
import * as web3Utils from '../../utils/web3';
import * as securityUtils from '../../utils/security';
import { EmailAction } from '../email/constants';
import { EmailService } from '../email/email.service';
import logger from '../../logger';
import {
  SiteKeyRepository,
  SiteKeyType,
  UserEntity,
  UserRepository,
  UserRole,
  UserService,
  UserStatus,
  type OperatorUserEntity,
  type Web2UserEntity,
} from '../user';
import {
  AuthError,
  AuthErrorMessage,
  DuplicatedUserAddressError,
  DuplicatedUserEmailError,
  InvalidOperatorFeeError,
  InvalidOperatorJobTypesError,
  InvalidOperatorRoleError,
  InvalidOperatorUrlError,
} from './auth.error';
import {
  ForgotPasswordDto,
  SuccessAuthDto,
  RefreshDto,
  Web2SignUpDto,
  Web2SignInDto,
  Web3SignInDto,
  Web3SignUpDto,
  RestorePasswordDto,
  VerifyEmailDto,
  ResendVerificationEmailDto,
} from './dto';
import { TokenEntity, TokenType } from './token.entity';
import { TokenRepository } from './token.repository';

@Injectable()
export class AuthService {
  private readonly logger = logger.child({
    context: AuthService.name,
  });
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenRepository: TokenRepository,
    private readonly serverConfigService: ServerConfigService,
    private readonly authConfigService: AuthConfigService,
    private readonly ndaConfigService: NDAConfigService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly emailService: EmailService,
    private readonly userRepository: UserRepository,
    private readonly siteKeyRepository: SiteKeyRepository,
  ) {}

  async signup(data: Web2SignUpDto): Promise<void> {
    const storedUser = await this.userRepository.findOneByEmail(data.email);
    if (storedUser) {
      throw new DuplicatedUserEmailError(data.email);
    }

    const newUser = new UserEntity();
    newUser.email = data.email;
    newUser.password = securityUtils.hashPassword(data.password);
    newUser.role = UserRole.WORKER;
    newUser.status = UserStatus.PENDING;

    const userEntity = await this.userRepository.createUnique(newUser);

    const tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.EMAIL;
    tokenEntity.userId = userEntity.id;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.verifyEmailTokenExpiresIn * 1000,
    );

    await this.tokenRepository.createUnique(tokenEntity);
    await this.emailService.sendEmail(data.email, EmailAction.SIGNUP, {
      url: `${this.serverConfigService.feURL}/verify?token=${tokenEntity.uuid}`,
    });
  }

  async web3Signup(
    data: Web3SignUpDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findOneByAddress(data.address);
    if (user) {
      throw new DuplicatedUserAddressError(data.address);
    }

    const preSignUpData = web3Utils.prepareSignatureBody({
      from: data.address,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.SIGNUP,
    });

    const isValidSignature = web3Utils.verifySignature(
      preSignUpData,
      data.signature,
      [data.address],
    );

    if (!isValidSignature) {
      throw new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    }

    const chainId = this.web3ConfigService.reputationNetworkChainId;
    const role = await KVStoreUtils.get(
      chainId,
      data.address,
      KVStoreKeys.role,
    );

    // We need to exclude ReputationOracle role
    const isValidRole = [
      Role.JobLauncher,
      Role.ExchangeOracle,
      Role.RecordingOracle,
    ].includes(role);

    if (!isValidRole) {
      throw new InvalidOperatorRoleError(role);
    }

    const fee = await KVStoreUtils.get(chainId, data.address, KVStoreKeys.fee);
    if (!fee) {
      throw new InvalidOperatorFeeError(fee);
    }

    const url = await KVStoreUtils.get(chainId, data.address, KVStoreKeys.url);
    if (!url) {
      throw new InvalidOperatorUrlError(url);
    }

    const jobTypes = await KVStoreUtils.get(
      chainId,
      data.address,
      KVStoreKeys.jobTypes,
    );
    if (!jobTypes) {
      throw new InvalidOperatorJobTypesError(jobTypes);
    }

    const newUser = new UserEntity();
    newUser.evmAddress = data.address.toLowerCase();
    newUser.nonce = web3Utils.generateNonce();
    newUser.role = UserRole.OPERATOR;
    newUser.status = UserStatus.PENDING;

    const userEntity = await this.userRepository.createUnique(newUser);

    return this.web3Auth(userEntity);
  }

  async signin({
    email,
    password,
  }: Web2SignInDto): Promise<{ accessToken: string; refreshToken: string }> {
    const userEntity = await this.userService.findWeb2UserByEmail(email);
    if (!userEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_CREDENTIALS);
    }

    if (!securityUtils.comparePasswordWithHash(password, userEntity.password)) {
      throw new AuthError(AuthErrorMessage.INVALID_CREDENTIALS);
    }

    return this.auth(userEntity);
  }

  async web3Signin(data: Web3SignInDto): Promise<SuccessAuthDto> {
    const userEntity = await this.userService.findOperatorUser(data.address);

    if (!userEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_ADDRESS);
    }

    const preSigninData = web3Utils.prepareSignatureBody({
      from: data.address,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.SIGNIN,
      nonce: userEntity.nonce,
    });
    const isValidSignature = web3Utils.verifySignature(
      preSigninData,
      data.signature,
      [data.address],
    );

    if (!isValidSignature) {
      throw new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    }

    const nonce = web3Utils.generateNonce();
    await this.userRepository.updateOneById(userEntity.id, { nonce });

    return this.web3Auth(userEntity);
  }

  async auth(
    userEntity: Web2UserEntity | UserEntity,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let siteKey: string | undefined;
    const hCaptchaSiteKey = await this.siteKeyRepository.findByUserAndType(
      userEntity.id,
      SiteKeyType.HCAPTCHA,
    );
    if (hCaptchaSiteKey && hCaptchaSiteKey.length > 0) {
      // We know for sure that only one hcaptcha sitekey might exist
      siteKey = hCaptchaSiteKey[0].siteKey;
    }

    const jwtPayload = {
      email: userEntity.email,
      status: userEntity.status,
      user_id: userEntity.id,
      wallet_address: userEntity.evmAddress,
      role: userEntity.role,
      kyc_status: userEntity.kyc?.status,
      nda_signed:
        userEntity.ndaSignedUrl === this.ndaConfigService.latestNdaUrl,
      reputation_network: this.web3ConfigService.operatorAddress,
      qualifications: userEntity.userQualifications
        ? userEntity.userQualifications.map(
            (userQualification) => userQualification.qualification.reference,
          )
        : [],
      site_key: siteKey,
    };

    return await this.generateTokens(userEntity.id, jwtPayload);
  }

  async web3Auth(
    userEntity: OperatorUserEntity | UserEntity,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jwtPayload = {
      status: userEntity.status,
      user_id: userEntity.id,
      wallet_address: userEntity.evmAddress,
      role: userEntity.role,
      reputation_network: this.web3ConfigService.operatorAddress,
    };
    return await this.generateTokens(userEntity.id, jwtPayload);
  }

  async generateTokens(
    userId: number,
    jwtPayload: Record<string, unknown>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshTokenEntity =
      await this.tokenRepository.findOneByUserIdAndType(
        userId,
        TokenType.REFRESH,
      );

    if (refreshTokenEntity) {
      await this.tokenRepository.deleteOne(refreshTokenEntity);
    }

    const newRefreshTokenEntity = new TokenEntity();
    newRefreshTokenEntity.userId = userId;
    newRefreshTokenEntity.type = TokenType.REFRESH;
    const date = new Date();
    newRefreshTokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.refreshTokenExpiresIn * 1000,
    );

    await this.tokenRepository.createUnique(newRefreshTokenEntity);

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: this.authConfigService.accessTokenExpiresIn,
    });

    return { accessToken, refreshToken: newRefreshTokenEntity.uuid };
  }

  async refresh(data: RefreshDto): Promise<SuccessAuthDto> {
    const tokenEntity = await this.tokenRepository.findOneByUuidAndType(
      data.refreshToken,
      TokenType.REFRESH,
    );

    if (!tokenEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_REFRESH_TOKEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new AuthError(AuthErrorMessage.REFRESH_TOKEN_EXPIRED);
    }

    const userEntity = await this.userRepository.findOneById(
      tokenEntity.userId,
      {
        relations: {
          kyc: true,
          siteKeys: true,
        },
      },
    );

    if (!userEntity) {
      this.logger.warn('User not found during token refresh', {
        userId: tokenEntity.userId,
      });
      throw new AuthError(AuthErrorMessage.INVALID_REFRESH_TOKEN);
    }

    return this.auth(userEntity);
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    const userEntity = await this.userRepository.findOneByEmail(data.email);

    if (!userEntity) {
      return;
    }

    const existingToken = await this.tokenRepository.findOneByUserIdAndType(
      userEntity.id,
      TokenType.PASSWORD,
    );

    if (existingToken) {
      await this.tokenRepository.deleteOne(existingToken);
    }

    const tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.PASSWORD;
    tokenEntity.userId = userEntity.id;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.forgotPasswordExpiresIn * 1000,
    );

    await this.tokenRepository.createUnique(tokenEntity);
    await this.emailService.sendEmail(data.email, EmailAction.RESET_PASSWORD, {
      url: `${this.serverConfigService.feURL}/reset-password?token=${tokenEntity.uuid}`,
    });
  }

  async restorePassword(data: RestorePasswordDto): Promise<void> {
    const tokenEntity = await this.tokenRepository.findOneByUuidAndType(
      data.token,
      TokenType.PASSWORD,
      {
        relations: {
          user: true,
        },
      },
    );

    if (!tokenEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_PASSWORD_TOKEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new AuthError(AuthErrorMessage.PASSWORD_TOKEN_EXPIRED);
    }

    const hashedPassword = securityUtils.hashPassword(data.password);

    const isPasswordChanged = await this.userRepository.updateOneById(
      tokenEntity.userId,
      {
        password: hashedPassword,
      },
    );

    if (isPasswordChanged) {
      await this.emailService.sendEmail(
        tokenEntity.user?.email as string,
        EmailAction.PASSWORD_CHANGED,
      );

      await this.tokenRepository.deleteOne(tokenEntity);
    }
  }

  async emailVerification(data: VerifyEmailDto): Promise<void> {
    const tokenEntity = await this.tokenRepository.findOneByUuidAndType(
      data.token,
      TokenType.EMAIL,
    );

    if (!tokenEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_EMAIL_TOKEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      throw new AuthError(AuthErrorMessage.EMAIL_TOKEN_EXPIRED);
    }

    await this.userRepository.updateOneById(tokenEntity.userId, {
      status: UserStatus.ACTIVE,
    });
  }

  async resendEmailVerification(
    user: Web2UserEntity,
    data: ResendVerificationEmailDto,
  ): Promise<void> {
    if (user.status !== UserStatus.PENDING) {
      return;
    }

    const existingToken = await this.tokenRepository.findOneByUserIdAndType(
      user.id,
      TokenType.EMAIL,
    );

    if (existingToken) {
      await this.tokenRepository.deleteOne(existingToken);
    }

    const tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.EMAIL;
    tokenEntity.userId = user.id;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.verifyEmailTokenExpiresIn * 1000,
    );

    await this.tokenRepository.createUnique(tokenEntity);
    await this.emailService.sendEmail(data.email, EmailAction.SIGNUP, {
      url: `${this.serverConfigService.feURL}/verify?token=${tokenEntity.uuid}`,
    });
  }
}
