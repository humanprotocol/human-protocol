import axios from 'axios';
import { CaseConverter } from './case-converter';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_EXCHANGE_ORACLE_SERVER_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (config.data) {
      config.data = CaseConverter.transformToSnakeCase(config.data);
    }

    if (config.params) {
      config.params = CaseConverter.transformToSnakeCase(config.params);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = CaseConverter.transformToCamelCase(response.data);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
