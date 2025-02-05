import axios from 'axios';
import { env } from '../helpers/env';

export const httpService = axios.create({
  baseURL: env.VITE_API_URL,
});
