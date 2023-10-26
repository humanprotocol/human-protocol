import { Currency } from '../enums/payment';
import { UserStatus, UserType } from '../enums/user';
import { IBase } from './base';

export interface IUser extends IBase {
  password: string;
  email: string;
  status: UserStatus;
  type: UserType;
}

export interface IUserBalance {
  amount: number;
  currency: Currency;
}
