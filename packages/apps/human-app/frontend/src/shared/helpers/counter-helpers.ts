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
