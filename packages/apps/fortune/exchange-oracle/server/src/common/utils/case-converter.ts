export class CaseConverter {
  static transformToCamelCase(input: any): any {
    if (typeof input === 'string') {
      return input.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    } else if (Array.isArray(input)) {
      return input.map((item) => CaseConverter.transformToCamelCase(item));
    } else if (typeof input === 'object' && input !== null) {
      return Object.keys(input).reduce(
        (acc: Record<string, any>, key: string) => {
          const camelCaseKey = key.replace(/_([a-z])/g, (g) =>
            g[1].toUpperCase(),
          );
          acc[camelCaseKey] = CaseConverter.transformToCamelCase(input[key]);
          return acc;
        },
        {},
      );
    } else {
      return input;
    }
  }

  static transformToSnakeCase(input: any): any {
    function camelToSnakeKey(id: string): string {
      if (!id) return id;
      const parts = id
        .replace(/([a-z\d])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .split(/[\s_-]+/)
        .filter(Boolean);
      return parts.map((p) => p.toLowerCase()).join('_');
    }
    if (typeof input === 'string') {
      return camelToSnakeKey(input);
    } else if (Array.isArray(input)) {
      return input.map((item) => CaseConverter.transformToSnakeCase(item));
    } else if (typeof input === 'object' && input !== null) {
      return Object.keys(input).reduce(
        (acc: Record<string, any>, key: string) => {
          const snakeCaseKey = camelToSnakeKey(key);
          acc[snakeCaseKey] = CaseConverter.transformToSnakeCase(input[key]);
          return acc;
        },
        {},
      );
    } else {
      return input;
    }
  }
}
