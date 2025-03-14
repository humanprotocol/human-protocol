import { faker } from '@faker-js/faker';

import * as securityUtils from '../../../utils/security';
import * as web3Utils from '../../../utils/web3';
import { generateEthWallet } from '../../../../test/fixtures/web3';

import { OperatorUserEntity, Web2UserEntity } from '../types';
import { Role, UserStatus } from '../user.entity';
import { SetNonNullable } from 'type-fest';

type Web2UserWithAddress = SetNonNullable<Web2UserEntity, 'evmAddress'>;

type GeneratedUser<T> = T extends { withAddress: true }
  ? Web2UserWithAddress
  : Web2UserEntity;

type GenerateUserOptions = {
  withAddress?: boolean;
  status?: UserStatus;
};
export function generateWorkerUser<T extends GenerateUserOptions>(
  options?: T,
): GeneratedUser<T> {
  const _options = Object.assign(
    {
      withAddress: false,
      status: UserStatus.ACTIVE,
    },
    options || {},
  );

  const password = faker.internet.password();
  const passwordHash = securityUtils.hashPassword(password);

  const generatedUser: Web2UserEntity | Web2UserWithAddress = {
    id: faker.number.int(),
    email: faker.internet.email(),
    password: passwordHash,
    ndaSignedUrl: null,
    role: Role.WORKER,
    evmAddress: null,
    status: _options.status,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),

    nonce: null,
  };

  if (_options.withAddress) {
    generatedUser.evmAddress = generateEthWallet().address.toLowerCase();
  }

  return generatedUser as GeneratedUser<T>;
}

type GenerateOperatorOptions = {
  status?: UserStatus;
};
export function generateOperator(
  options: GenerateOperatorOptions = {},
): OperatorUserEntity {
  const _options = Object.assign(
    {
      status: UserStatus.ACTIVE,
    },
    options || {},
  );

  const user: OperatorUserEntity = {
    id: faker.number.int(),
    role: Role.OPERATOR,
    evmAddress: generateEthWallet().address,
    status: _options.status,
    nonce: web3Utils.generateNonce(),
    createdAt: faker.date.recent(),
    updatedAt: new Date(),

    email: null,
    password: null,
    ndaSignedUrl: null,
  };

  return user;
}
