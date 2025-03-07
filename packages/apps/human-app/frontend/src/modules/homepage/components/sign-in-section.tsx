import { Paper, Button, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useHomePageState } from '@/shared/contexts/homepage-state';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { OperatorSignIn } from './operator-sign-in';
import { WorkerSignIn } from './worker-sign-in';

export function SignInSection() {
  const isMobile = useIsMobile('lg');
  const { colorPalette } = useColorMode();
  const { setPageView } = useHomePageState();
  const { t } = useTranslation();

  return (
    <Paper
      sx={{
        px: isMobile ? '16px' : '4.1875rem',
        py: isMobile ? '32px' : '4.8125rem',
        backgroundColor: colorPalette.paper.light,
        boxShadow: 'none',
        borderRadius: '20px',
      }}
    >
      <Button
        color="secondary"
        fullWidth
        onClick={() => {
          setPageView('chooseSignUpAccountType');
        }}
        size="large"
        sx={{ mb: '1.5625rem' }}
        variant="contained"
      >
        {t('homepage.signUp')}
      </Button>
      <Divider component="div" sx={{ mb: '1.5625rem' }} variant="middle" />
      <WorkerSignIn />
      <OperatorSignIn />
    </Paper>
  );
}
