export class CaseConverter {
  static transformToCamelCase(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelCaseKey = key.replace(/_([a-z])/g, (g) =>
          g[1].toUpperCase(),
        );
        result[camelCaseKey] = obj[key];
      }
    }
    return result;
  }

  static transformToSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => CaseConverter.transformToSnakeCase(item));
    } else if (typeof obj === 'object' && obj !== null) {
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
