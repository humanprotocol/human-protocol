export const generateCacheKey = (...parts: (string | number)[]): string => {
  return ['governance', ...parts].map(String).join(':');
};
