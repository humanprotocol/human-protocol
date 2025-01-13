const MODE_LOCAL_STORAGE_KEY = 'mode';

export const setModeInLocalStorage = (mode: 'dark' | 'light') => {
  localStorage.setItem(MODE_LOCAL_STORAGE_KEY, mode);
};

export const isDarkInModeLocalStorage = () => {
  const mode = localStorage.getItem(MODE_LOCAL_STORAGE_KEY);
  if (mode === 'dark') {
    return true;
  }
  return false;
};

export const isModeSetILocalStorage = () => {
  return Boolean(localStorage.getItem(MODE_LOCAL_STORAGE_KEY));
};
