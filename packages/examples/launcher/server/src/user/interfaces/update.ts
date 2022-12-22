import { UserStatus } from "../../common/decorators";
import { IUserCommonDto } from "../../common/dto";

export interface IUserUpdateDto extends IUserCommonDto {
  status?: UserStatus;
  socketId?: string;
  tokenAddress?: string;
}
