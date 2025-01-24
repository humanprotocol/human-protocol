const MODE_LOCAL_STORAGE_KEY = 'mode';

export const saveColorMode = (mode: 'dark' | 'light') => {
  localStorage.setItem(MODE_LOCAL_STORAGE_KEY, mode);
};

export const isDarkColorMode = () => {
  const mode = localStorage.getItem(MODE_LOCAL_STORAGE_KEY);
  if (mode === 'dark') {
    return true;
  }
  return false;
};

export const hasColorMode = () => {
  return Boolean(localStorage.getItem(MODE_LOCAL_STORAGE_KEY));
};
