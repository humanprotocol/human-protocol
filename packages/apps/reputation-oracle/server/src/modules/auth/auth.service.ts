import { KVStoreKeys, KVStoreUtils, Role } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { SignatureType } from '../../common/enums';
import {
  AuthConfigService,
  NDAConfigService,
  ServerConfigService,
  Web3ConfigService,
} from '../../config';
import logger from '../../logger';
import * as httpUtils from '../../utils/http';
import * as securityUtils from '../../utils/security';
import * as web3Utils from '../../utils/web3';

import { EmailAction, EmailService } from '../email';
import {
  OperatorStatus,
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
  InactiveUserError,
  InvalidOperatorFeeError,
  InvalidOperatorRoleError,
  InvalidOperatorUrlError,
} from './auth.error';
import { TokenEntity, TokenType } from './token.entity';
import { TokenRepository } from './token.repository';
import type { AuthTokens } from './types';

@Injectable()
export class AuthService {
  private readonly logger = logger.child({
    context: AuthService.name,
  });
  constructor(
    private readonly authConfigService: AuthConfigService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly ndaConfigService: NDAConfigService,
    private readonly serverConfigService: ServerConfigService,
    private readonly siteKeyRepository: SiteKeyRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  async signup(email: string, password: string): Promise<void> {
    const storedUser = await this.userRepository.findOneByEmail(email);
    if (storedUser) {
      throw new DuplicatedUserEmailError(email);
    }

    const newUser = new UserEntity();
    newUser.email = email;
    newUser.password = securityUtils.hashPassword(password);
    newUser.role = UserRole.WORKER;
    newUser.status = UserStatus.PENDING;

    const userEntity = await this.userRepository.createUnique(newUser);

    const tokenEntity = new TokenEntity();
    tokenEntity.type = TokenType.EMAIL;
    tokenEntity.userId = userEntity.id;
    const date = new Date();
    tokenEntity.expiresAt = new Date(
      date.getTime() + this.authConfigService.verifyEmailTokenExpiresIn,
    );

    const token = await this.tokenRepository.createUnique(tokenEntity);
    await this.emailService.sendEmail(email, EmailAction.SIGNUP, {
      url: `${this.serverConfigService.feURL}/verify?token=${token.uuid}`,
    });
  }

  async web3Signup(signature: string, address: string): Promise<AuthTokens> {
    const user = await this.userRepository.findOneByAddress(address);
    if (user) {
      throw new DuplicatedUserAddressError(address);
    }

    const preSignUpData = web3Utils.prepareSignatureBody({
      from: address,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.SIGNUP,
    });

    const isValidSignature = web3Utils.verifySignature(
      preSignUpData,
      signature,
      [address],
    );

    if (!isValidSignature) {
      throw new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    }

    const chainId = this.web3ConfigService.reputationNetworkChainId;
    let role = '';
    try {
      role = await KVStoreUtils.get(chainId, address, KVStoreKeys.role);
    } catch (noop) {}

    // We need to exclude ReputationOracle role
    const isValidRole = [
      Role.JobLauncher,
      Role.ExchangeOracle,
      Role.RecordingOracle,
    ].includes(role);

    if (!isValidRole) {
      throw new InvalidOperatorRoleError(role);
    }

    let fee = '';
    try {
      fee = await KVStoreUtils.get(chainId, address, KVStoreKeys.fee);
    } catch (noop) {}
    if (!fee) {
      throw new InvalidOperatorFeeError(fee);
    }

    let url = '';
    try {
      url = await KVStoreUtils.get(chainId, address, KVStoreKeys.url);
    } catch (noop) {}
    if (!url || !httpUtils.isValidHttpUrl(url)) {
      throw new InvalidOperatorUrlError(url);
    }

    const newUser = new UserEntity();
    newUser.evmAddress = address.toLowerCase();
    newUser.nonce = web3Utils.generateNonce();
    newUser.role = UserRole.OPERATOR;
    newUser.status = UserStatus.ACTIVE;

    const userEntity = await this.userRepository.createUnique(newUser);

    return this.web3Auth(userEntity as OperatorUserEntity);
  }

  async signin(email: string, password: string): Promise<AuthTokens> {
    const userEntity = await this.userService.findWeb2UserByEmail(email);
    if (!userEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_CREDENTIALS);
    }

    if (userEntity.status === UserStatus.INACTIVE) {
      throw new InactiveUserError(userEntity.id);
    }

    if (!securityUtils.comparePasswordWithHash(password, userEntity.password)) {
      throw new AuthError(AuthErrorMessage.INVALID_CREDENTIALS);
    }

    return this.auth(userEntity);
  }

  async web3Signin(address: string, signature: string): Promise<AuthTokens> {
    const userEntity = await this.userService.findOperatorUser(address);

    if (!userEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_ADDRESS);
    }

    if (userEntity.status === UserStatus.INACTIVE) {
      throw new InactiveUserError(userEntity.id);
    }

    const preSigninData = web3Utils.prepareSignatureBody({
      from: address,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.SIGNIN,
      nonce: userEntity.nonce,
    });
    const isValidSignature = web3Utils.verifySignature(
      preSigninData,
      signature,
      [address],
    );

    if (!isValidSignature) {
      throw new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE);
    }

    const nonce = web3Utils.generateNonce();
    await this.userRepository.updateOneById(userEntity.id, { nonce });

    return this.web3Auth(userEntity);
  }

  async auth(userEntity: Web2UserEntity | UserEntity): Promise<AuthTokens> {
    let hCaptchaSiteKey: string | undefined;
    const hCaptchaSiteKeys = await this.siteKeyRepository.findByUserAndType(
      userEntity.id,
      SiteKeyType.HCAPTCHA,
    );
    if (hCaptchaSiteKeys && hCaptchaSiteKeys.length > 0) {
      // We know for sure that only one hcaptcha sitekey might exist
      hCaptchaSiteKey = hCaptchaSiteKeys[0].siteKey;
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
            (userQualification) => userQualification.qualification?.reference,
          )
        : [],
      site_key: hCaptchaSiteKey,
    };

    return this.generateTokens(userEntity.id, jwtPayload);
  }

  async web3Auth(userEntity: OperatorUserEntity): Promise<AuthTokens> {
    /**
     * NOTE
     * In case if operator recently activated/deactivated itself
     * and subgraph does not have the actual value yet,
     * the status can be outdated
     */
    let operatorStatus = OperatorStatus.INACTIVE;
    try {
      operatorStatus = (await KVStoreUtils.get(
        this.web3ConfigService.reputationNetworkChainId,
        this.web3ConfigService.operatorAddress,
        userEntity.evmAddress,
      )) as OperatorStatus;
    } catch (noop) {}

    const jwtPayload = {
      status: userEntity.status,
      user_id: userEntity.id,
      wallet_address: userEntity.evmAddress,
      role: userEntity.role,
      reputation_network: this.web3ConfigService.operatorAddress,
      operator_status: operatorStatus,
    };
    return this.generateTokens(userEntity.id, jwtPayload);
  }

  async generateTokens(
    userId: number,
    jwtPayload: Record<string, unknown>,
  ): Promise<AuthTokens> {
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
      date.getTime() + this.authConfigService.refreshTokenExpiresIn,
    );

    await this.tokenRepository.createUnique(newRefreshTokenEntity);

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: this.authConfigService.accessTokenExpiresIn,
    });

    return { accessToken, refreshToken: newRefreshTokenEntity.uuid };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenEntity = await this.tokenRepository.findOneByUuidAndType(
      refreshToken,
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

    if (userEntity.role === UserRole.OPERATOR) {
      return this.web3Auth(userEntity as OperatorUserEntity);
    } else {
      return this.auth(userEntity);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const userEntity = await this.userRepository.findOneByEmail(email);

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
      date.getTime() + this.authConfigService.forgotPasswordExpiresIn,
    );

    const token = await this.tokenRepository.createUnique(tokenEntity);
    await this.emailService.sendEmail(email, EmailAction.RESET_PASSWORD, {
      url: `${this.serverConfigService.feURL}/reset-password?token=${token.uuid}`,
    });
  }

  async restorePassword(password: string, token: string): Promise<void> {
    const tokenEntity = await this.tokenRepository.findOneByUuidAndType(
      token,
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

    const hashedPassword = securityUtils.hashPassword(password);

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

  async emailVerification(token: string): Promise<void> {
    const tokenEntity = await this.tokenRepository.findOneByUuidAndType(
      token,
      TokenType.EMAIL,
    );

    if (!tokenEntity) {
      throw new AuthError(AuthErrorMessage.INVALID_EMAIL_TOKEN);
    }

    if (new Date() > tokenEntity.expiresAt) {
      await this.tokenRepository.deleteOne(tokenEntity);
      throw new AuthError(AuthErrorMessage.EMAIL_TOKEN_EXPIRED);
    }

    await this.userRepository.updateOneById(tokenEntity.userId, {
      status: UserStatus.ACTIVE,
    });
    await this.tokenRepository.deleteOne(tokenEntity);
  }

  async resendEmailVerification(user: Web2UserEntity): Promise<void> {
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
      date.getTime() + this.authConfigService.verifyEmailTokenExpiresIn,
    );

    const token = await this.tokenRepository.createUnique(tokenEntity);
    await this.emailService.sendEmail(user.email, EmailAction.SIGNUP, {
      url: `${this.serverConfigService.feURL}/verify?token=${token.uuid}`,
    });
  }
}
