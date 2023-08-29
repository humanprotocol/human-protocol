import { useState, useEffect } from 'react';
import * as paymentService from '../services/payment';

export const useTokenRate = (from: string, to: string) => {
  const [rate, setRate] = useState(0);

  useEffect(() => {
    const getRate = async () => {
      const _rate = await paymentService.getRate(from, to);

      setRate(_rate);
    };

    getRate();
  }, [from, to]);

  return rate;
};
