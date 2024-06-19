export interface ParsedDate {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function parseDate(delta: number): ParsedDate {
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

// implementation used like in prev version of human app
export function getTomorrowDate() {
  const today = new Date();
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

  const newDateObj = new Date(
    tomorrow.getTime() - deltaDays * DAY_IN_MSS - timeZoneOffset * 60000
  );

  return newDateObj;
}
