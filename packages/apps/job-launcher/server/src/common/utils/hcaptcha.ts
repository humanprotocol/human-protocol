import axios from 'axios';
import { formatAxiosError } from './http';

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

  try {
    const { data } = await axios.post(
      `${url}/siteverify`,
      {},
      { params: queryParams },
    );

    return data;
  } catch (error) {
    return {
      success: false,
      error: formatAxiosError(error),
    };
  }
}
