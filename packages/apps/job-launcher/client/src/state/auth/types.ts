export type UserBalance = {
  amount: number;
  currency: string;
};

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

export type User = {
  balance?: UserBalance;
  email: string;
  status: UserStatus;
};

export type AuthState = {
  isAuthed: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
};
