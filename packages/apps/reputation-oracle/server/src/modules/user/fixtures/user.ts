import { faker } from '@faker-js/faker';
import { SetNonNullable } from 'type-fest';

import * as securityUtils from '../../../utils/security';
import * as web3Utils from '../../../utils/web3';
import { generateEthWallet } from '../../../../test/fixtures/web3';

import { OperatorUserEntity, Web2UserEntity } from '../types';
import { Role, UserStatus } from '../user.entity';

type Web2UserWithAddress = SetNonNullable<Web2UserEntity, 'evmAddress'>;

type GeneratedUser<T> = T extends { privateKey: string }
  ? Web2UserWithAddress
  : Web2UserEntity;

type GenerateUserOptions = {
  privateKey?: string;
  status?: UserStatus;
};
export function generateWorkerUser<T extends GenerateUserOptions>(
  options?: T,
): GeneratedUser<T> {
  const password = faker.internet.password();
  const passwordHash = securityUtils.hashPassword(password);

  const generatedUser: Web2UserEntity | Web2UserWithAddress = {
    id: faker.number.int(),
    email: faker.internet.email(),
    password: passwordHash,
    ndaSignedUrl: null,
    role: Role.WORKER,
    evmAddress: null,
    status: options?.status || UserStatus.ACTIVE,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),

    nonce: null,
  };

  if (options?.privateKey) {
    generatedUser.evmAddress = generateEthWallet(
      options.privateKey,
    ).address.toLowerCase();
  }

  return generatedUser as GeneratedUser<T>;
}

type GenerateOperatorOptions = {
  privateKey?: string;
  status?: UserStatus;
};
export function generateOperator(
  options: GenerateOperatorOptions = {},
): OperatorUserEntity {
  const user: OperatorUserEntity = {
    id: faker.number.int(),
    role: Role.OPERATOR,
    evmAddress: generateEthWallet(options?.privateKey).address.toLowerCase(),
    status: options?.status || UserStatus.ACTIVE,
    nonce: web3Utils.generateNonce(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),

    email: null,
    password: null,
    ndaSignedUrl: null,
  };

  return user;
}
