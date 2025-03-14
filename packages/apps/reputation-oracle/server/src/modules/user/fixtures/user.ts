import { faker } from '@faker-js/faker';

import * as securityUtils from '../../../utils/security';
import { generateEthWallet } from '../../../../test/fixtures/web3';

import { Web2UserEntity } from '../types';
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
    nonce: null,
    status: _options.status,
    createdAt: faker.date.recent(),
    updatedAt: new Date(),
  };

  if (_options.withAddress) {
    generatedUser.evmAddress = generateEthWallet().address.toLowerCase();
  }

  return generatedUser as GeneratedUser<T>;
}
