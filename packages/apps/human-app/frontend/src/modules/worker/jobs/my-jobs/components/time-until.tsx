import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const SECOND_IN_MS = 1000;
const MINUTE_IN_SECONDS = 60;
const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS;
const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;

const UNIT_LABEL_KEYS = {
  days: {
    singular: 'worker.jobs.timeUntil.day',
    plural: 'worker.jobs.timeUntil.days',
  },
  hours: {
    singular: 'worker.jobs.timeUntil.hour',
    plural: 'worker.jobs.timeUntil.hours',
  },
  minutes: {
    singular: 'worker.jobs.timeUntil.minute',
    plural: 'worker.jobs.timeUntil.minutes',
  },
  seconds: {
    singular: 'worker.jobs.timeUntil.second',
    plural: 'worker.jobs.timeUntil.seconds',
  },
} as const;

type TimeUnit = keyof typeof UNIT_LABEL_KEYS;

function getRemainingTime(
  targetTime: number,
  now: number
): {
  value: number;
  unit: TimeUnit;
} {
  const totalSeconds = Math.max(
    0,
    Math.floor((targetTime - now) / SECOND_IN_MS)
  );

  if (totalSeconds >= DAY_IN_SECONDS) {
    return {
      value: Math.floor(totalSeconds / DAY_IN_SECONDS),
      unit: 'days',
    };
  }

  if (totalSeconds >= HOUR_IN_SECONDS) {
    return {
      value: Math.floor(totalSeconds / HOUR_IN_SECONDS),
      unit: 'hours',
    };
  }

  if (totalSeconds >= MINUTE_IN_SECONDS) {
    return {
      value: Math.floor(totalSeconds / MINUTE_IN_SECONDS),
      unit: 'minutes',
    };
  }

  return {
    value: totalSeconds,
    unit: 'seconds',
  };
}

export function TimeUntil({ date }: { date?: string | null }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());

  const targetTime = useMemo(() => {
    if (!date) {
      return null;
    }

    const parsedTime = new Date(date).getTime();

    return Number.isNaN(parsedTime) ? null : parsedTime;
  }, [date]);

  useEffect(() => {
    if (targetTime === null || targetTime <= Date.now()) {
      return;
    }

    setNow(Date.now());

    const intervalId = setInterval(() => {
      const nextNow = Date.now();

      setNow(nextNow);

      if (nextNow >= targetTime) {
        clearInterval(intervalId);
      }
    }, SECOND_IN_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [targetTime]);

  if (targetTime === null || targetTime <= now) {
    return t('worker.jobs.expired');
  }

  const remainingTime = getRemainingTime(targetTime, now);
  const unitLabelKey =
    UNIT_LABEL_KEYS[remainingTime.unit][
      remainingTime.value === 1 ? 'singular' : 'plural'
    ];

  return (
    <>
      {remainingTime.value} {t(unitLabelKey)}
    </>
  );
}
