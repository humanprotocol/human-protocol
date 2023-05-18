import { v4 } from "uuid";

import { UserCreateDto } from "../../modules/user/user.dto";
import { UserStatus, UserType } from "../enums/user";

export const generateUserCreateDto = (data: Partial<UserCreateDto> = {}): UserCreateDto => {
  return Object.assign(
    {
      password: "human",
      confirm: "human",
      type: UserType.REQUESTER,
      status: UserStatus.ACTIVE,
      privateKey: 'pk',
      publicKey: 'pk',
      email: `human+${v4()}@human.com`,
    },
    data,
  );
};
