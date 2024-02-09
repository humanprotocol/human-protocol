import axios from 'axios';

export async function verifyToken(
  url: string,
  sitekey: string,
  secret: string,
  token: string,
  ip?: string,
) {
  const queryParams: any = {
    secret,
    sitekey,
    response: token,
  };

  if (ip) {
    queryParams.remoteip = ip;
  }

  const { data } = await axios.post(
    `${url}/siteverify`,
    {},
    { params: queryParams },
  );

  return data;
}
