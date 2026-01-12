import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_DASHBOARD_API_URL,
});

export default axiosInstance;
