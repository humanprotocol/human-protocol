import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_JOB_LAUNCHER_SERVER_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('HUMAN_JOB_LAUNCHER_ACCESS_TOKEN');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      error?.response?.data?.message === 'Token expired'
    ) {
      localStorage.removeItem('HUMAN_JOB_LAUNCHER_REFRESH_TOKEN');
      localStorage.removeItem('HUMAN_JOB_LAUNCHER_ACCESS_TOKEN');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
