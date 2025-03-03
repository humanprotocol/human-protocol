export const addColorSchemePrefsListener = (
  fn: (matches: boolean) => void
): (() => void) => {
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
