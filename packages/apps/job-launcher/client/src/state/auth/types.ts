export type AuthState = {
  isAuthed: boolean;
  user: any;
  token: string | null;
  refreshToken: string | null;
};
