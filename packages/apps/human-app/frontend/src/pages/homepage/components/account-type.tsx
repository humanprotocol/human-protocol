import { Container, Grid, List, ListItemText, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { BackArrowIcon } from '@/components/ui/icons';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';

interface AccountType {
  setStep: (step: number) => void;
}

export function AccountType({ setStep }: AccountType) {
  const { t } = useTranslation();
  return (
    <Container maxWidth="md">
      <Button
        onClick={() => {
          setStep(0);
        }}
        size="medium"
        sx={{
          position: 'absolute',
          right: '30px',
          top: '30px',
        }}
      >
        <Typography variant="buttonMedium">
          {t('components.signUpPage.cancel')}
        </Typography>
      </Button>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Button
            onClick={() => {
              setStep(0);
            }}
            sx={{
              position: 'absolute',
              marginLeft: -7,
              marginTop: 1,
            }}
            variant="text"
          >
            <BackArrowIcon />
          </Button>
          <Typography variant="h4">
            {t('components.signUpPage.welcome')} 👋
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h4">
            {t('components.signUpPage.howWillUse')}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle1">
            {t('components.signUpPage.selectOption')}
          </Typography>
        </Grid>
        <Grid
          item
          sx={{
            paddingTop: '44px',
          }}
          xs={6}
        >
          <Typography color={colorPalette.primary.light} variant="h6">
            {t('components.signUpPage.iWantToEarn')}
          </Typography>
          <List sx={{ listStyleType: 'disc', listStylePosition: 'inside' }}>
            <ListItemText
              primary={t('components.signUpPage.completeTask')}
              primaryTypographyProps={{
                variant: 'subtitle2',
                sx: {
                  display: 'list-item',
                },
              }}
            />
            <ListItemText
              primary={t('components.signUpPage.workAnywhere')}
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
          xs={6}
        >
          <Typography color={colorPalette.primary.light} variant="h6">
            {t('components.signUpPage.joinAsOperator')}
          </Typography>
          <List sx={{ listStyleType: 'disc', listStylePosition: 'inside' }}>
            <ListItemText
              primary={t('components.signUpPage.runAsOracle')}
              primaryTypographyProps={{
                variant: 'subtitle2',
                sx: {
                  display: 'list-item',
                },
              }}
            />
            <ListItemText
              primary={t('components.signUpPage.becomePartner')}
              primaryTypographyProps={{
                variant: 'subtitle2',
                sx: {
                  display: 'list-item',
                },
              }}
            />
          </List>
        </Grid>
        <Grid item xs={6}>
          <Button fullWidth size="large" variant="contained">
            {t('components.signUpPage.signUpToComplete')}
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button fullWidth size="large" variant="contained">
            {t('components.signUpPage.signAsOperator')}
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
}
