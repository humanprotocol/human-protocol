import { useEffect, useState } from 'react';
import type { CountDownResult } from '@/shared/helpers/counter-helpers';
import { countdown } from '@/shared/helpers/counter-helpers';

export function useCountDown(
  date: number,
  onFinish?: () => void
): CountDownResult | null {
  const [dates, setDates] = useState<CountDownResult | null>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const time = countdown(date);

      if (
        time.days < 1 &&
        time.hours < 1 &&
        time.minutes < 1 &&
        time.seconds < 1
      ) {
        setIsDone(true);
        if (onFinish) {
          onFinish();
        }
      }

      if (!isDone) {
        setDates(time);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ...
  }, []);

  return isDone ? { days: 0, minutes: 0, hours: 0, seconds: 0 } : dates;
}
