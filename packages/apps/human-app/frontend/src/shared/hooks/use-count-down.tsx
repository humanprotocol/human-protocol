import { useEffect, useState } from 'react';
import type { ParsedDate } from '@/shared/helpers/counter-helpers';
import { parseDate } from '@/shared/helpers/counter-helpers';

export function useCountDown(
  timeBetweenNowAndEndDateProp: number,
  onFinish?: () => void
): ParsedDate | null {
  const [timeDifference, setTimeDifference] = useState<number>(
    timeBetweenNowAndEndDateProp
  );
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (timeDifference < 0) {
        setIsDone(true);
        if (onFinish) {
          onFinish();
        }
        return;
      }
      setTimeDifference((timestamp) => timestamp - 1000);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ...
  }, []);

  return isDone
    ? { days: 0, minutes: 0, hours: 0, seconds: 0 }
    : parseDate(timeDifference);
}
