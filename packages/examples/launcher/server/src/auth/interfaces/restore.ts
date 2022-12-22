import { IValidatePasswordDto } from "./password";

export interface IRestorePasswordDto extends IValidatePasswordDto {
  token: string;
}
