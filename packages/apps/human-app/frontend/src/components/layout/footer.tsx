import type { Theme } from '@mui/material';
import {
  Grid,
  Link,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { ChatIcon, DiscordIcon } from '../ui/icons';

export function Footer() {
  const { t } = useTranslation();
  const theme: Theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Grid container>
      <Grid
        alignItems="center"
        container
        item
        justifyContent="center"
        sx={{
          display: { md: 'none' },
        }}
        xs={12}
      >
        <Link href="#" underline="none">
          <GitHubIcon
            sx={{
              mr: '19px',
            }}
          />
        </Link>
        <Link href="#" underline="none">
          <DiscordIcon />
        </Link>
        <Link href="#" underline="none">
          <TwitterIcon
            sx={{
              mx: '19px',
            }}
          />
        </Link>
        <Link href="#" underline="none">
          <LinkedInIcon />
        </Link>
      </Grid>
      <Grid
        alignItems={isMobile ? 'flex-start' : 'center'}
        container
        direction="column"
        justifyContent="center"
        xs={isMobile ? 11 : 12}
      >
        <Stack
          direction="row"
          sx={{
            display: { xs: 'none', md: 'flex' },
          }}
        >
          <Link href="#" sx={{ mr: 1.5 }} underline="none">
            <Typography variant="subtitle1">
              {t('components.footer.privacyPolicy')}
            </Typography>
          </Link>
          <Link href="#" sx={{ mr: 1.5 }} underline="none">
            <Typography variant="subtitle1">
              {t('components.footer.termsOfService')}
            </Typography>
          </Link>
          <Link href="#" underline="none">
            <Typography variant="subtitle1">
              {t('components.footer.humanProtocol')}
            </Typography>
          </Link>
        </Stack>
        <Typography align="center" variant="subtitle1">
          {t('components.footer.copyrightNote')}
        </Typography>
      </Grid>
      <Grid
        alignItems="center"
        container
        justifyContent="flex-end"
        sx={{
          display: { xs: 'none', md: 'flex' },
        }}
        xs={1}
      >
        <ChatIcon />
      </Grid>
    </Grid>
  );
}
