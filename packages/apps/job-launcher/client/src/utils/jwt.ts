import { jwtDecode, JwtPayload } from 'jwt-decode';
import { UserStatus } from '../state/auth/types';

export function getJwtPayload(token: string) {
  const { email, status } = jwtDecode<{ email: string; status: UserStatus }>(
    token,
  );
  return { email, status };
}

export function isJwtExpired(token: string) {
  const { exp } = jwtDecode<JwtPayload>(token);
  return Date.now() >= Number(exp) * 1000;
}
