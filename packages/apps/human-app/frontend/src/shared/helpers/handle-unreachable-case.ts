export function handleUnreachableCase(value: never) {
  throw new Error(`Value is not handled: ${value as unknown as string}`);
}
