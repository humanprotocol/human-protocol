export const setPreference = (key: string, value: any): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getPreference = <T>(key: string, defaultValue: T): T => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};
