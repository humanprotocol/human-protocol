import { UserStatus, UserType } from '../enums/user';
import { UserCreateDto } from 'src/modules/user/user.dto';

export const generateTestUser = (
  data: Partial<UserCreateDto> = {},
): Partial<UserCreateDto> => {
  return Object.assign(
    {
      password: 'HUMAN',
      email: `human@hmt.ai` as string,
      confirm: 'human',
      type: UserType.REQUESTER,
      status: UserStatus.ACTIVE,
    },
    data,
  );
};
