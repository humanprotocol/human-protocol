import { SetNonNullable } from 'type-fest';
import { UserEntity } from './user.entity';

export type Web2UserEntity = SetNonNullable<UserEntity, 'email' | 'password'>;

export type OperatorUserEntity = SetNonNullable<
  UserEntity,
  'evmAddress' | 'nonce'
>;
