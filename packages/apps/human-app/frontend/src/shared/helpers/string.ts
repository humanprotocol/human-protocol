import queryString from 'query-string';

export function stringifyUrlQueryObject(obj: object) {
  return queryString.stringify(obj);
}

export function padZero(num: number): string {
  return num < 10 ? `0${num.toString()}` : num.toString();
}
