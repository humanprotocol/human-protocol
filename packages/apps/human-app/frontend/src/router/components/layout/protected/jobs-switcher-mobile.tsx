import { routerPaths } from '@/router/router-paths';
import { Button } from '@/shared/components/ui/button';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import { Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

const BUTTONS = [
  {
    label: 'worker.jobs.availableJobs',
    path: routerPaths.jobsDiscovery,
  },
  {
    label: 'worker.jobs.myJobs',
    path: routerPaths.myJobs,
  },
] as const satisfies { label: string; path: string }[];

export function JobsSwitcherMobile() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const shadowColor = isDarkMode
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.1)';

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        width: '100%',
        p: 0.5,
        gap: 1,
        maxWidth: '500px',
        mx: 'auto',
        borderRadius: '90px',
        bgcolor: colorPalette.background.default,
      }}
    >
      {BUTTONS.map((button) => {
        const isActive = pathname === button.path;
        return (
          <Button
            key={button.label}
            component={Link}
            to={button.path}
            fullWidth
            sx={{
              color: colorPalette.text.primary,
              opacity: isActive ? 1 : 0.8,
              fontSize: '14px',
              fontWeight: isActive ? 700 : 600,
              bgcolor: isActive ? colorPalette.background.paper : 'transparent',
              borderRadius: '90px',
              boxShadow: isActive ? `3px 3px 24px 0px ${shadowColor}` : 'none',
            }}
          >
            {t(button.label)}
          </Button>
        );
      })}
    </Stack>
  );
}
