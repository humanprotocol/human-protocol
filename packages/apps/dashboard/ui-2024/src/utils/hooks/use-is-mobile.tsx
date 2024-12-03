import useMediaQuery from '@mui/material/useMediaQuery';

type Breakpoints = 'mobile' | 'mid';

const breakpoints = {
  mobile: `(max-width: 1100px)`,
  mid: `(max-width: 1100px)`,
};

export function useBreakPoints(breakpoint: Breakpoints = 'mobile') {
  const matchesMobile = useMediaQuery(breakpoints[breakpoint]);
  return {
    mobile: {
      isMobile: matchesMobile,
      mediaQuery: `@media ${breakpoints.mobile}`,
    },
  };
}
