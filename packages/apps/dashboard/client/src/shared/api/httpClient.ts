import axios from 'axios';

import { env } from '@/shared/lib/env';

const httpClient = axios.create({
  baseURL: env.VITE_API_URL,
});

export default httpClient;
