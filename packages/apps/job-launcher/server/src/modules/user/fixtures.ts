import { faker } from '@faker-js/faker';
import { UserStatus, UserType } from '../../common/enums/user';
import { UserEntity } from './user.entity';

export const createUser = (overrides: Partial<UserEntity> = {}): UserEntity => {
  const user = new UserEntity();
  user.id = faker.number.int();
  user.email = faker.internet.email();
  user.password = faker.internet.password();
  user.type = faker.helpers.arrayElement(Object.values(UserType));
  user.status = faker.helpers.arrayElement(Object.values(UserStatus));
  user.paymentProviderId = faker.string.uuid();
  user.jobs = [];
  user.payments = [];
  user.apiKey = null;
  user.whitelist = null;
  user.createdAt = faker.date.recent();
  user.updatedAt = new Date();
  Object.assign(user, overrides);
  return user;
};
