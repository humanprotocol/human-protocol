import useMediaQuery from '@mui/material/useMediaQuery';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const breakpoints = {
  xs: '(max-width: 600px)',
  sm: '(min-width: 601px) and (max-width: 900px)',
  md: '(min-width: 901px) and (max-width: 1200px)',
  lg: '(min-width: 1201px) and (max-width: 1536px)',
  xl: '(min-width: 1537px)',
} as const;

export type BreakpointResult = {
  [K in Breakpoint]: {
    isActive: boolean;
    mediaQuery: string;
  };
};

const useBreakpoints = (): BreakpointResult => {
  const matchesXs = useMediaQuery(breakpoints.xs);
  const matchesSm = useMediaQuery(breakpoints.sm);
  const matchesMd = useMediaQuery(breakpoints.md);
  const matchesLg = useMediaQuery(breakpoints.lg);
  const matchesXl = useMediaQuery(breakpoints.xl);

  return {
    xs: {
      isActive: matchesXs,
      mediaQuery: `@media ${breakpoints.xs}`,
    },
    sm: {
      isActive: matchesSm,
      mediaQuery: `@media ${breakpoints.sm}`,
    },
    md: {
      isActive: matchesMd,
      mediaQuery: `@media ${breakpoints.md}`,
    },
    lg: {
      isActive: matchesLg,
      mediaQuery: `@media ${breakpoints.lg}`,
    },
    xl: {
      isActive: matchesXl,
      mediaQuery: `@media ${breakpoints.xl}`,
    },
  };
};

export const useIsMobile = () => {
  const { xs, sm } = useBreakpoints();
  return xs.isActive || sm.isActive;
};
