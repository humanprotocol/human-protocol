import { SignInRequest, SignUpRequest, SignUpResponse } from '../types';
import api from '../utils/api';

export const signIn = async (body: SignInRequest) => {
  const { data } = await api.post<SignUpResponse>('/auth/signIn', body);

  return data;
};

export const signUp = async (body: SignUpRequest) => {
  const { data } = await api.post<SignUpResponse>('/auth/signup', body);

  return data;
};

export const signOut = async (refreshToken: string) => {
  const { data } = await api.post('/auth/logout', { refreshToken });

  return data;
};

export default { signIn, signUp };
