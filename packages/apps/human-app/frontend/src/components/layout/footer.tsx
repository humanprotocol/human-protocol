import { Grid, Link, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { colorPalette } from '@/styles/color-palette';
import { ChatIcon } from '../ui/icons';

export function Footer() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <Grid
      container
      sx={{
        backgroundColor: isMobile ? colorPalette.paper.main : 'transparent',
        px: isMobile ? 0 : '44px',
        pb: isMobile ? 0 : '44px',
        pt: '32px',
      }}
    >
      <Grid
        alignItems="flex-start"
        container
        direction="column"
        justifyContent="center"
        sx={{
          px: isMobile ? '32px' : 0,
        }}
        xs={isMobile ? 12 : 11}
      >
        <Stack direction={isMobile ? 'column' : 'row'}>
          <Link
            href="#"
            sx={{ mr: 1.5, mb: isMobile ? '10px' : 0 }}
            underline="none"
          >
            <Typography color={colorPalette.text.secondary} variant="caption">
              {t('components.footer.privacyPolicy')}
            </Typography>
          </Link>
          <Link
            href="#"
            sx={{ mr: 1.5, mb: isMobile ? '10px' : 0 }}
            underline="none"
          >
            <Typography color={colorPalette.text.secondary} variant="caption">
              {t('components.footer.termsOfService')}
            </Typography>
          </Link>
          <Link
            href="#"
            sx={{
              mb: isMobile ? '10px' : 0,
            }}
            underline="none"
          >
            <Typography color={colorPalette.text.secondary} variant="caption">
              {t('components.footer.humanProtocol')}
            </Typography>
          </Link>
        </Stack>
        <Typography
          align={isMobile ? 'left' : 'center'}
          color={colorPalette.text.secondary}
          sx={{
            pb: isMobile ? '32px' : 0,
          }}
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
          position: isMobile ? 'absolute' : 'relative',
          right: isMobile ? '32px' : 0,
        }}
        xs={isMobile ? 12 : 1}
      >
        <ChatIcon />
      </Grid>
    </Grid>
  );
}
