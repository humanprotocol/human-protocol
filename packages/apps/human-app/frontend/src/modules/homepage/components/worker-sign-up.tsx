import {
  Grid,
  Typography,
  List,
  ListItemText,
  Button,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { useColorMode } from '@/shared/contexts/color-mode';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';

export function WorkerSignUp() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { t } = useTranslation();

  return (
    <Grid size={{ xs: 12, lg: 6 }}>
      <Grid
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
        }}
      >
        <Stack>
          <Typography
            variant="h6"
            sx={{
              color: isDarkMode
                ? onlyDarkModeColor.additionalTextColor
                : colorPalette.primary.light,
            }}
          >
            {t('homepage.iWantToEarn')}
          </Typography>
          <List
            sx={{
              listStyleType: 'disc',
              listStylePosition: 'inside',
              pl: '0.5rem',
            }}
          >
            <ListItemText
              primary={t('homepage.completeTask')}
              slotProps={{
                primary: {
                  variant: 'subtitle2',
                  sx: {
                    display: 'list-item',
                  },
                },
              }}
            />
            <ListItemText
              primary={t('homepage.workAnywhere')}
              slotProps={{
                primary: {
                  variant: 'subtitle2',
                  sx: {
                    display: 'list-item',
                  },
                },
              }}
            />
          </List>
        </Stack>
        <Grid
          size={12}
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            pt: 4,
          }}
        >
          <Button
            component={Link}
            to={routerPaths.worker.signUp}
            variant="contained"
            size="large"
            fullWidth
          >
            {t('homepage.signUpToComplete')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
}
