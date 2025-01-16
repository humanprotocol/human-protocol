const MODE_LOCAL_STORAGE_KEY = 'mode';

export const saveColorModeStateInLocalStorage = (mode: 'dark' | 'light') => {
  localStorage.setItem(MODE_LOCAL_STORAGE_KEY, mode);
};

export const isDarkColorModeEnabledInLocalStorage = () => {
  const mode = localStorage.getItem(MODE_LOCAL_STORAGE_KEY);
  if (mode === 'dark') {
    return true;
  }
  return false;
};

export const isColorModeStateSavedInLocalStorage = () => {
  return Boolean(localStorage.getItem(MODE_LOCAL_STORAGE_KEY));
};
