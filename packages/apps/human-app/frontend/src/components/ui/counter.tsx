import { useCountDown } from '@/hooks/use-count-down';
import { padZero } from '@/shared/helpers/counter-helpers';

export function Counter({
  date,
  onFinish,
}: {
  date: string;
  onFinish?: () => void;
}) {
  const time = useCountDown(new Date(date).getTime() - Date.now(), onFinish);
  if (!time) {
    return null;
  }

  if (!time.days && !time.hours && !time.minutes) {
    return `00:${padZero(time.seconds)}`;
  }
  if (!time.days && !time.hours) {
    return `${padZero(time.minutes)}:${padZero(time.seconds)}`;
  }
  if (!time.days) {
    return `${padZero(time.hours)}:${padZero(time.minutes)}:${padZero(time.seconds)}`;
  }

  return `${time.days}:${padZero(time.hours)}:${padZero(time.minutes)}:${padZero(time.seconds)}`;
}
