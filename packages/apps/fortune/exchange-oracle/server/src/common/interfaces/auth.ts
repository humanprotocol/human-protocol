
import { TokenType } from "../enums/auth";
import { IBase } from "./base";

export interface IJwt {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
}

export interface IToken extends IBase {
  uuid: string;
  tokenType: TokenType;
}