import { UserStatus, UserType } from "../../common/decorators";
import { UserEntity } from "../user.entity";

export interface IUserDto {
  id: number;
  email: string;
  status: UserStatus;
  type: UserType;
}

export const userFormatter = (userEntity: UserEntity): IUserDto => {
  return {
    id: userEntity.id,
    email: userEntity.email,
    status: userEntity.status,
    type: userEntity.type,
  };
};
