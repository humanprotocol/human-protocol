import { v4 } from "uuid";
import { IUser, UserStatus, UserType } from "../decorators";

export const generateTestUser = (data: Partial<IUser> = {}): Partial<IUser> => {
  return Object.assign(
    {
      password: "HUMAN",
      email: `human+${v4()}@hmt.ai`,
      type: UserType.REQUESTER,
      status: UserStatus.ACTIVE,
    },
    data,
  );
};
