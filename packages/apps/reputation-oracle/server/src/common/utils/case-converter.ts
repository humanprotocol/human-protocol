export class CaseConverter {
  static transformToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => CaseConverter.transformToCamelCase(item));
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj).reduce(
        (acc: Record<string, any>, key: string) => {
          const camelCaseKey = key.replace(/_([a-z])/g, (g) =>
            g[1].toUpperCase(),
          );
          acc[camelCaseKey] = CaseConverter.transformToCamelCase(obj[key]);
          return acc;
        },
        {},
      );
    } else {
      return obj;
    }
  }

  static transformToSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => CaseConverter.transformToSnakeCase(item));
    } else if (typeof obj === 'object' && obj !== null) {
      if (obj instanceof Date) {
        return obj.toISOString(); // Convert Date object to ISO string format
      }
      return Object.keys(obj).reduce(
        (acc: Record<string, any>, key: string) => {
          const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          acc[snakeCaseKey] = CaseConverter.transformToSnakeCase(obj[key]);
          return acc;
        },
        {},
      );
    } else {
      return obj;
    }
  }
}
