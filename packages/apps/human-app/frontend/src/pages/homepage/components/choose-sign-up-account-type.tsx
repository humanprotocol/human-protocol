import { Grid, List, ListItemText, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-is-mobile';
import type { HomePageStageType } from '@/pages/homepage/components/home-container';
import { routerPaths } from '@/router/router-paths';
import { PageCard } from '@/components/ui/page-card';

interface ChooseSignUpAccountType {
  setStage: (step: HomePageStageType) => void;
}

export function ChooseSignUpAccountType({ setStage }: ChooseSignUpAccountType) {
  const { t } = useTranslation();
  const isMobile = useIsMobile('lg');

  const backToWelcomeStage = () => {
    setStage('welcome');
  };

  return (
    <PageCard
      backArrowPath={backToWelcomeStage}
      cancelRouterPathOrCallback={backToWelcomeStage}
      childrenMaxWidth="876px"
      title={<Typography variant="h4">{t('homepage.welcome')} 👋</Typography>}
    >
      <Grid container spacing={4} width="100%">
        <Grid item xs={12}>
          <Typography variant="h4">{t('homepage.howWillUse')}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle1">
            {t('homepage.selectOption')}
          </Typography>
        </Grid>
        <Grid
          item
          sx={{
            paddingTop: '44px',
          }}
          xs={isMobile ? 12 : 6}
        >
          <Grid
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'space-between',
            }}
          >
            <Typography color={colorPalette.primary.light} variant="h6">
              {t('homepage.iWantToEarn')}
            </Typography>
            <List
              sx={{
                listStyleType: 'disc',
                listStylePosition: 'inside',
                paddingLeft: '0.5rem',
              }}
            >
              <ListItemText
                primary={t('homepage.completeTask')}
                primaryTypographyProps={{
                  variant: 'subtitle2',
                  sx: {
                    display: 'list-item',
                  },
                }}
              />
              <ListItemText
                primary={t('homepage.workAnywhere')}
                primaryTypographyProps={{
                  variant: 'subtitle2',
                  sx: {
                    display: 'list-item',
                  },
                }}
              />
            </List>
            <Grid
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                paddingTop: '2rem',
              }}
              xs={12}
            >
              <Button
                component={Link}
                fullWidth
                size="large"
                to={routerPaths.worker.signUp}
                variant="contained"
              >
                {t('homepage.signUpToComplete')}
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid
          item
          sx={{
            paddingTop: '44px',
          }}
          xs={isMobile ? 12 : 6}
        >
          <Typography color={colorPalette.primary.light} variant="h6">
            {t('homepage.joinAsOperator')}
          </Typography>
          <List
            sx={{
              listStyleType: 'disc',
              listStylePosition: 'inside',
              paddingLeft: '0.5rem',
            }}
          >
            <ListItemText
              primary={t('homepage.runAsOracle')}
              primaryTypographyProps={{
                variant: 'subtitle2',
                sx: {
                  display: 'list-item',
                },
              }}
            />
            <ListItemText
              primary={t('homepage.becomePartner')}
              primaryTypographyProps={{
                variant: 'subtitle2',
                sx: {
                  display: 'list-item',
                },
              }}
            />
          </List>
          <Grid
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              paddingTop: '2rem',
            }}
            xs={12}
          >
            <Button
              component={Link}
              fullWidth
              size="large"
              to={routerPaths.operator.connectWallet}
              variant="contained"
            >
              {t('homepage.signAsOperator')}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </PageCard>
  );
}
