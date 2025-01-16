import queryString from 'query-string';

export function stringifyUrlQueryObject(obj: object) {
  return queryString.stringify(obj);
}
