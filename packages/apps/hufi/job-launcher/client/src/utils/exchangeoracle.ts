import axios from 'axios';

const exchangeOracle = axios.create({
  baseURL: import.meta.env.VITE_APP_EXCHANGE_ORACLE_URL,
});

export default exchangeOracle;
