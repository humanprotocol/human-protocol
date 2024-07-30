// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ..
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}
