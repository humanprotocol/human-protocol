import { Grid, Link, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { colorPalette } from '@/styles/color-palette';
import { ChatIcon, DiscordIcon } from '../ui/icons';

export function Footer({ sx }: { sx?: SxProps<Theme> }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <Grid component="footer" sx={{ width: '100%', ...sx }}>
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
              color="secondary"
              sx={{
                mr: '19px',
              }}
            />
          </Link>
          <Link href="#" underline="none">
            <DiscordIcon color="secondary" />
          </Link>
          <Link href="#" underline="none">
            <TwitterIcon
              color="secondary"
              sx={{
                mx: '19px',
              }}
            />
          </Link>
          <Link href="#" underline="none">
            <LinkedInIcon color="secondary" />
          </Link>
        </Grid>
        <Grid
          alignItems={isMobile ? 'center' : 'flex-start'}
          container
          direction="column"
          justifyContent="center"
          xs={isMobile ? 12 : 11}
        >
          <Stack
            direction="row"
            sx={{
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <Link href="#" sx={{ mr: 1.5 }} underline="none">
              <Typography color={colorPalette.text.secondary} variant="caption">
                {t('components.footer.privacyPolicy')}
              </Typography>
            </Link>
            <Link href="#" sx={{ mr: 1.5 }} underline="none">
              <Typography color={colorPalette.text.secondary} variant="caption">
                {t('components.footer.termsOfService')}
              </Typography>
            </Link>
            <Link href="#" underline="none">
              <Typography color={colorPalette.text.secondary} variant="caption">
                {t('components.footer.humanProtocol')}
              </Typography>
            </Link>
          </Stack>
          <Typography
            align="center"
            color={colorPalette.text.secondary}
            variant="caption"
          >
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
    </Grid>
  );
}
