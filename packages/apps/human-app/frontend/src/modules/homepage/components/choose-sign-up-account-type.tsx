import { Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { PageCard } from '@/shared/components/ui/page-card';
import type { HomePageStageType } from '@/modules/homepage/views/home.page';
import { useHomePageState } from '@/shared/contexts/homepage-state';
import { WorkerSignUp } from './worker-sign-up';
import { OperatorSignUp } from './operator-sign-up';

interface ChooseSignUpAccountType {
  setStage: (step: HomePageStageType) => void;
}

export function ChooseSignUpAccountType() {
  const { setPageView } = useHomePageState();
  const { t } = useTranslation();
  const isMobileMd = useIsMobile('md');

  const backToWelcomeStage = () => {
    setPageView('welcome');
  };

  return (
    <PageCard
      backNavigation={backToWelcomeStage}
      cancelNavigation={backToWelcomeStage}
      childrenMaxWidth="876px"
      showCancelButton={isMobileMd}
      maxContentWidth="748px"
      title={<Typography variant="h4">{t('homepage.welcome')} 👋</Typography>}
    >
      <Grid container spacing={4}>
        <Grid item sx={{ paddingBottom: '16px' }} xs={12}>
          <Typography variant="h4">{t('homepage.howWillUse')}</Typography>
        </Grid>
        <WorkerSignUp />
        <OperatorSignUp />
      </Grid>
    </PageCard>
  );
}
