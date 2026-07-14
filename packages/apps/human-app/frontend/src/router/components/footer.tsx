import { Grid, Link, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { env } from '@/shared/env';
import { Chat } from '@/modules/homepage/components/chat';
import { breakpoints } from '@/shared/styles/breakpoints';
import { useColorMode } from '@/shared/contexts/color-mode';

interface FooterProps {
  displayChatIcon?: boolean;
  isProtected?: boolean;
}

export function Footer({ isProtected, displayChatIcon = true }: FooterProps) {
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();
  const isMobile = useIsMobile('md');

  return (
    <Grid
      component="footer"
      container
      sx={{
        width: '100%',
        pr: 0,
        pl: { xs: 0, md: isProtected ? '200px' : '0' },
        pb: { xs: 0, md: 4 },
        [breakpoints.mobile]: {
          p: 4,
          backgroundColor: colorPalette.paper.main,
        },
      }}
    >
      <Grid
        size={{ xs: 12, md: 11 }}
        sx={{
          alignItems: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{
            gap: 3,
            lineHeight: '166%',
            [breakpoints.mobile]: {
              gap: 2.5,
            },
          }}
        >
          <Link
            href={env.VITE_PRIVACY_POLICY_URL}
            rel="noreferrer"
            target="_blank"
            sx={{
              textDecoration: 'none',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: colorPalette.text.secondary }}
            >
              {t('components.footer.privacyPolicy')}
            </Typography>
          </Link>
          <Link
            href={env.VITE_TERMS_OF_SERVICE_URL}
            rel="noreferrer"
            target="_blank"
            sx={{
              textDecoration: 'none',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: colorPalette.text.secondary }}
            >
              {t('components.footer.termsOfService')}
            </Typography>
          </Link>
          <Link
            href={env.VITE_HUMAN_PROTOCOL_URL}
            target="_blank"
            rel="noreferrer"
            sx={{
              mb: { xs: '10px', md: 0 },
              textDecoration: 'none',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: colorPalette.text.secondary }}
            >
              {t('components.footer.humanProtocol')}
            </Typography>
          </Link>
          {isMobile ? (
            <Typography
              variant="caption"
              sx={{ color: colorPalette.text.secondary }}
            >
              {t('components.footer.copyrightNote')}
            </Typography>
          ) : null}
        </Stack>
        {!isMobile ? (
          <Typography
            variant="caption"
            sx={{ color: colorPalette.text.secondary }}
          >
            {t('components.footer.copyrightNote')}
          </Typography>
        ) : null}
      </Grid>
      <Grid
        size={{ xs: 12, md: 1 }}
        sx={{
          position: { xs: 'absolute', md: 'relative' },
          right: { xs: '32px', md: 0 },
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <Chat displayChatIcon={displayChatIcon} />
      </Grid>
    </Grid>
  );
}
