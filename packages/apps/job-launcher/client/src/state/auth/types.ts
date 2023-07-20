export type AuthState = {
  isAuthed: boolean;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
};
