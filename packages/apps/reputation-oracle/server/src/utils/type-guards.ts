import { JobRequestType } from '../common/enums';

export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

export function assertValidJobRequestType(
  value: string,
): asserts value is JobRequestType {
  const validValues = Object.values<string>(JobRequestType);

  if (validValues.includes(value)) {
    return;
  }

  throw new Error(`Unsupported request type: ${value}`);
}
