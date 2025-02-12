/**
 * TODO: check if replacing it with lodash.camelCase
 * won't break anything
 */
export function snakeToCamel(input: string): string {
  return input.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
}

/**
 * TODO: check if replacing it with lodash.snakeCase
 * won't break anything
 */
export function camelToSnake(input: string): string {
  return input.replace(/([A-Z])/g, '_$1').toLowerCase();
}
