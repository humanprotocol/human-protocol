import { v4 } from "uuid";

import { IUserCreateDto } from "../../user/interfaces";

export const generateUserCreateDto = (data: Partial<IUserCreateDto> = {}): IUserCreateDto => {
  return Object.assign(
    {
      password: "human",
      confirm: "human",
      captcha: "HUMAN",
      email: `human+${v4()}@human.com`,
    },
    data,
  );
};
