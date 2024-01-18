import axios from 'axios';
import { CaseConverter } from './case-converter';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_JOB_LAUNCHER_SERVER_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('HUMAN_JOB_LAUNCHER_ACCESS_TOKEN');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (config.data) {
      config.data = CaseConverter.transformToSnakeCase(config.data);
    }

    if (config.params) {
      config.params = CaseConverter.transformToSnakeCase(config.params);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = CaseConverter.transformToCamelCase(response.data);
    }
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      const message = error?.response?.data?.message;
      if (message !== 'User not found' && message !== 'User not active') {
        localStorage.removeItem('HUMAN_JOB_LAUNCHER_REFRESH_TOKEN');
        localStorage.removeItem('HUMAN_JOB_LAUNCHER_ACCESS_TOKEN');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
