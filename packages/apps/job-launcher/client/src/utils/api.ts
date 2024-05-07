import axios from 'axios';
import { CaseConverter } from './case-converter';
import { LOCAL_STORAGE_KEYS } from 'src/constants';

interface FailedPromise {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_JOB_LAUNCHER_SERVER_URL,
});

let isRefreshing = false;

let failedQueue: FailedPromise[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

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
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
          });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(
        LOCAL_STORAGE_KEYS.refreshToken,
      );

      return new Promise((resolve, reject) => {
        axiosInstance
          .post('/auth/refresh', { refresh_token: refreshToken })
          .then(({ data }) => {
            localStorage.setItem(
              LOCAL_STORAGE_KEYS.accessToken,
              data.accessToken,
            );
            localStorage.setItem(
              LOCAL_STORAGE_KEYS.refreshToken,
              data.refreshToken,
            );
            error.config.headers['Authorization'] =
              `Bearer ${data.accessToken}`;
            resolve(axiosInstance(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            reject(err);
            localStorage.removeItem(LOCAL_STORAGE_KEYS.accessToken);
            localStorage.removeItem(LOCAL_STORAGE_KEYS.refreshToken);
            window.location.href = '/';
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
