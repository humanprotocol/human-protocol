import { IValidatePasswordDto } from "../../auth/interfaces";

export interface IUserCreateDto extends IValidatePasswordDto {
  email: string;
}
