import { useState, useEffect } from 'react';
import * as paymentService from '../services/payment';

export const useTokenRate = (token: string, currency: string) => {
  const [rate, setRate] = useState(0);

  useEffect(() => {
    const getRate = async () => {
      const _rate = await paymentService.getRate(token, currency);

      setRate(_rate);
    };

    getRate();
  }, [token, currency]);

  return rate;
};
