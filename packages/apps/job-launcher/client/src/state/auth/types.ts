export type UserBalance = {
  amount: number;
  currency: string;
};

export type User = {
  balance?: UserBalance;
  email: string;
};

export type AuthState = {
  isAuthed: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
};
