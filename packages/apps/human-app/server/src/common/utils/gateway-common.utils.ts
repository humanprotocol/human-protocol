import { instanceToPlain } from 'class-transformer';

function cleanParams(obj: any): any {
  return Object.entries(obj)
    .filter(([_, v]) => v != null)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}
export function toCleanObjParams(params: any, existingParams: any = {}): any {
  const plainParams = instanceToPlain(params);
  const typelessParams = cleanParams(plainParams);
  return { ...existingParams, ...typelessParams };
}
