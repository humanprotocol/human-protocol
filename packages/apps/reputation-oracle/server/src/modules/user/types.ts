import { SetNonNullable } from 'type-fest';
import { UserEntity } from './user.entity';

/**
 * ATM UserEntity is used to store two different domain objects
 * that have intersection in properties:
 * = Operator - aka "Oracle"; it should be authorized using web3 signature
 * and always has evmAddres, but never has email, password and some other fields
 * - Web2User - is "Worker", admin user and HUMAN App; they always
 * have email & password, but might not have evmAddress
 *
 * Until we split the DB model - we differentiate them in code using differen types.
 */

export type Web2UserEntity = SetNonNullable<UserEntity, 'email' | 'password'>;

export type OperatorUserEntity = SetNonNullable<
  UserEntity,
  'evmAddress' | 'nonce'
>;
