import { jwtDecode, JwtPayload } from 'jwt-decode';
import { UserStatus } from '../state/auth/types';

export function getJwtPayload(token: string) {
  const { email, status, whitelisted } = jwtDecode<{
    email: string;
    status: UserStatus;
    whitelisted: boolean;
  }>(token);
  return { email, status, whitelisted };
}

export function isJwtExpired(token: string) {
  const { exp } = jwtDecode<JwtPayload>(token);
  return Date.now() >= Number(exp) * 1000;
}
