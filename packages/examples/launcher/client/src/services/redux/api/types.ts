export interface IUser {
  name: string;
  email: string;
}

export interface IGenericResponse {
  status: string;
  message: string;
}

export interface ILoginPayload {
  username: string;
  password: string;
}

export interface ISignUpPayload {
  username: string;
  password: string;
  confirm: string;
}

export interface IAuth {
  isAuth?: boolean;
  isMetaMaskConnected?: boolean;
}

export interface IToken {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface IRefresh {
  refreshToken: string;
}
