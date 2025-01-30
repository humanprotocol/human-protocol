import { hasColorMode } from './color-mode-settings';

export const handleColorModeChange = (
  matches: boolean,
  setIsDarkMode: (value: boolean) => void
) => {
  if (hasColorMode()) {
    return;
  }
  setIsDarkMode(matches);
  if (matches) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
};

export const runColorMode = (
  fn: (matches: boolean) => void
): (() => void) | undefined => {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  fn(query.matches);

  const listener = (event: MediaQueryListEvent) => {
    fn(event.matches);
  };
  query.addEventListener('change', listener);

  return () => {
    query.removeEventListener('change', listener);
  };
};
