import jwtDecode, { JwtPayload } from 'jwt-decode';

export function getJwtPayload(token: string) {
  const { email } = jwtDecode<{ email: string }>(token);
  return email;
}

export function isJwtExpired(token: string) {
  const { exp } = jwtDecode<JwtPayload>(token);
  return Date.now() >= Number(exp) * 1000;
}
