import jwtDecode, { JwtPayload } from 'jwt-decode';

export function getJwtPayload(token: string) {
  const { email } = jwtDecode<{ email: string }>(token);
  return email;
}

export function isJwtExpired(token: string) {
  const { sub, exp } = jwtDecode<JwtPayload>(token);
  console.log(sub, exp);
  return Date.now() >= Number(exp) * 1000;
}
