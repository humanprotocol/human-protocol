import { isObject } from './type-guards';

type CaseTransformer = (input: string) => string;

/**
 * TODO: check if replacing it with lodash.camelCase
 * won't break anything
 */
export const snakeToCamel: CaseTransformer = (input) => {
  return input.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
};

/**
 * TODO: check if replacing it with lodash.snakeCase
 * won't break anything
 */
export const camelToSnake: CaseTransformer = (input) => {
  return input.replace(/([A-Z])/g, '_$1').toLowerCase();
};

function transformKeysCase(
  input: unknown,
  transformer: CaseTransformer,
): unknown {
  /**
   * Primitives and Date objects returned as is
   * to keep their original value for later use
   */
  if (!isObject(input) || input instanceof Date) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((value) => transformKeysCase(value, transformer));
  }

  const transformedObject: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    transformedObject[transformer(key)] = transformKeysCase(value, transformer);
  }
  return transformedObject;
}

export function transformKeysFromSnakeToCamel(input: unknown): unknown {
  return transformKeysCase(input, snakeToCamel);
}

export function transformKeysFromCamelToSnake(input: unknown): unknown {
  return transformKeysCase(input, camelToSnake);
}
