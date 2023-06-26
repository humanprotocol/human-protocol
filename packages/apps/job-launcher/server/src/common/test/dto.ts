import { v4 } from 'uuid';

import { UserCreateDto } from 'src/modules/user/user.dto';
import { UserStatus, UserType } from '../enums/user';

export const generateUserCreateDto = (
  data: Partial<UserCreateDto> = {},
): UserCreateDto => {
  return Object.assign(
    {
      password: 'human',
      confirm: 'human',
      email: `human+${v4()}@human.com`,
      type: UserType.REQUESTER,
      status: UserStatus.ACTIVE,
    },
    data,
  );
};
