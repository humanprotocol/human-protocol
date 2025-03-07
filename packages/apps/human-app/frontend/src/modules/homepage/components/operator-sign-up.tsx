import { Grid, Typography, List, ListItemText, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';

export function OperatorSignUp() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { t } = useTranslation();
  const isMobile = useIsMobile('lg');

  return (
    <Grid
      item
      sx={{
        paddingTop: '44px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      xs={isMobile ? 12 : 6}
    >
      <div>
        <Typography
          color={
            isDarkMode
              ? onlyDarkModeColor.additionalTextColor
              : colorPalette.primary.light
          }
          variant="h6"
        >
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
            primary={t('homepage.becomePartner')}
            primaryTypographyProps={{
              variant: 'subtitle2',
              sx: {
                display: 'list-item',
              },
            }}
          />
          <ListItemText
            primary={t('homepage.runAsOracle')}
            primaryTypographyProps={{
              variant: 'subtitle2',
              sx: {
                display: 'list-item',
              },
            }}
          />
        </List>
      </div>
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
          sx={{ fontFamily: 'Inter' }}
          to={routerPaths.operator.connectWallet}
          variant="contained"
        >
          {t('homepage.signAsOperator')}
        </Button>
      </Grid>
    </Grid>
  );
}
