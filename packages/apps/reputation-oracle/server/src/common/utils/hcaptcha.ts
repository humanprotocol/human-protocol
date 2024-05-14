import axios from 'axios';
import {
  hCaptchaGetLabeler,
  hCaptchaRegisterLabeler,
  hCaptchaVerifyToken,
} from '../dto/hcaptcha';

/**
 * Verifies the hCaptcha token.
 * @param {hCaptchaVerifyToken} data - The data required for token verification.
 * @returns {Promise<any>} - The verification result.
 */
export async function verifyToken(data: hCaptchaVerifyToken): Promise<any> {
  try {
    const { url, secret, sitekey, ip, token } = data;

    const queryParams: any = {
      secret,
      sitekey,
      response: token,
    };

    if (ip) {
      queryParams.remoteip = ip;
    }

    const response = await axios.post(
      `${url}/siteverify`,
      {},
      { params: queryParams },
    );

    if (response && response.data && response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error('Error occurred during token verification:', error);
  }

  return false;
}

/**
 * Registers a user as a labeler at hCaptcha Foundation.
 * @param {hCaptchaRegisterLabeler} data - The data required for user registration.
 * @returns {Promise<boolean>} - True if registration is successful, false otherwise.
 */
export async function registerLabeler(
  data: hCaptchaRegisterLabeler,
): Promise<boolean> {
  try {
    const { url, apiKey, ip, email, language, country, address } = data;

    const queryParams: any = {
      api_key: apiKey,
    };

    if (ip) {
      queryParams.remoteip = ip;
    }

    const response = await axios.post(
      `${url}/labeler/register`,
      {
        email,
        language,
        country,
        eth_addr: address,
      },
      {
        params: queryParams,
      },
    );

    if (response && response.status === 200) {
      return true;
    }
  } catch (error) {
    console.error('Error occurred during user registration:', error);
  }

  return false;
}

/**
 * Retrieves labeler data from hCaptcha Foundation.
 * @param {hCaptchaGetLabeler} data - The data required to retrieve labeler data.
 * @returns {Promise<any>} - The labeler data.
 */
export async function getLabelerData(data: hCaptchaGetLabeler): Promise<any> {
  try {
    const { url, apiKey, email } = data;

    const response = await axios.get(`${url}/support/users`, {
      params: { api_key: apiKey, email },
    });

    if (response && response.data && response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error('Error occurred while retrieving labeler data:', error);
  }

  return null;
}
