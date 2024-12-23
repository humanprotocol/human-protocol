export type UserBalance = {
  amount: number;
  currency: string;
};

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

export type User = {
  balance?: UserBalance;
  email: string;
  status: UserStatus;
  whitelisted: boolean;
};

export type AuthState = {
  isAuthed: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
};
