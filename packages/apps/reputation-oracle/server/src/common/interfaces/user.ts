import { UserStatus, Role } from '../enums/user';
import { IBase } from './base';

export interface IUser extends IBase {
  password: string;
  email: string;
  status: UserStatus;
  role: Role;
}
