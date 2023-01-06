import jwtDecode from 'jwt-decode';

export const getIsJwtExpired = (token: string): boolean => {
  const jwt: any = jwtDecode(token);
  const exp = jwt?.exp;
  return Date.now() >= exp * 1000;
};
