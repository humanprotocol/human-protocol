import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

const SECOND_IN_MS = 1000;

const DATE_FNS_LOCALES = {
  en: enUS,
} as const;

export function TimeUntil({ date }: { date?: string | null }) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(Date.now());

  const dateFnsLocale = useMemo(() => {
    const language = i18n.resolvedLanguage ?? i18n.language;
    const baseLanguage = language.split(
      '-'
    )[0] as keyof typeof DATE_FNS_LOCALES;

    return DATE_FNS_LOCALES[baseLanguage] ?? enUS;
  }, [i18n.language, i18n.resolvedLanguage]);

  const targetDate = useMemo(() => {
    if (!date) {
      return null;
    }

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }, [date]);

  useEffect(() => {
    const targetTime = targetDate?.getTime();

    if (targetTime == null || targetTime <= Date.now()) {
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
  }, [targetDate]);

  if (targetDate === null || targetDate.getTime() <= now) {
    return t('worker.jobs.expired');
  }

  return (
    <>
      {formatDistanceToNow(targetDate, {
        includeSeconds: true,
        locale: dateFnsLocale,
      })}
    </>
  );
}
