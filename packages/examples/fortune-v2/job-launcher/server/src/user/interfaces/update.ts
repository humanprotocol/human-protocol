import { IUserCommonDto } from "../../common/dto";
import { UserStatus } from "../../common/enums/user";

export interface IUserUpdateDto extends IUserCommonDto {
  status?: UserStatus;
  socketId?: string;
  tokenAddress?: string;
}
