import {
  Container,
  Grid,
  IconButton,
  List,
  ListItemText,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BackArrowIcon } from '@/components/ui/icons';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-is-mobile';
import type { HomePageStageType } from '@/pages/homepage/components/home-container';
import { routerPaths } from '@/router/router-paths';

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
    <Container
      maxWidth="md"
      sx={{
        paddingBottom: isMobile ? '44px' : 0,
        paddingTop: isMobile ? '12px' : 0,
        width: '100%',
        maxWidth: '1600px',
      }}
    >
      <Button
        onClick={backToWelcomeStage}
        size="medium"
        sx={{
          position: 'absolute',
          right: '30px',
          top: isMobile ? '21px' : '30px',
        }}
      >
        <Typography variant="buttonMedium">{t('homepage.cancel')}</Typography>
      </Button>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <IconButton
            onClick={backToWelcomeStage}
            sx={{
              position: isMobile ? 'relative' : 'absolute',
              marginLeft: isMobile ? '-20px' : -7,
              marginTop: isMobile ? 0 : 1,
              transform: isMobile ? 'scale(0.6)' : 'none',
            }}
          >
            <BackArrowIcon />
          </IconButton>
          <Typography variant="h4">{t('homepage.welcome')} 👋</Typography>
        </Grid>
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
          <Typography color={colorPalette.primary.light} variant="h6">
            {t('homepage.iWantToEarn')}
          </Typography>
          <List sx={{ listStyleType: 'disc', listStylePosition: 'inside' }}>
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
          <List sx={{ listStyleType: 'disc', listStylePosition: 'inside' }}>
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
        </Grid>
        <Grid item xs={isMobile ? 12 : 6}>
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
        <Grid item xs={isMobile ? 12 : 6}>
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
    </Container>
  );
}
