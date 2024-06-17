export interface CountDownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function countdown(futureTimestamp: number): CountDownResult {
  const now = new Date().getTime();
  const delta = futureTimestamp - now;

  const days = Math.floor(delta / (1000 * 60 * 60 * 24));
  const hours = Math.floor((delta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((delta % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
  };
}

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export function getTomorrowDate() {
  const today = new Date();
  // Need to calculate a timezone offset
  const timeZoneOffset = today.getTimezoneOffset();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(7);
  tomorrow.setMinutes(0);
  tomorrow.setSeconds(0);
  tomorrow.setMilliseconds(0);

  const DAY_IN_MSS = 24 * 60 * 60 * 1000;
  const deltaDays = Math.floor(
    (tomorrow.getTime() - today.getTime()) / DAY_IN_MSS
  );

  // We need to show countdown till 07:00 UTC time
  const newDateObj = new Date(
    tomorrow.getTime() - deltaDays * DAY_IN_MSS - timeZoneOffset * 60000
  );

  return newDateObj;
}
