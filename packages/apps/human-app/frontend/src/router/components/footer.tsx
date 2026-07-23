import { Grid, Link, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { env } from '@/shared/env';
import { Chat } from '@/modules/homepage/components/chat';
import { useColorMode } from '@/shared/contexts/color-mode';

interface FooterProps {
  displayChatIcon?: boolean;
  isProtected?: boolean;
}

export function Footer({ isProtected, displayChatIcon = true }: FooterProps) {
  const { colorPalette, isDarkMode } = useColorMode();
  const { t } = useTranslation();

  const footerTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.70)' : '#676767';

  return (
    <Grid
      component="footer"
      container
      sx={{
        width: '100%',
        py: { xs: 2, md: 4 },
        pr: 3,
        pl: { xs: 3, md: isProtected ? '200px' : 3 },
        bgcolor: { xs: colorPalette.paper.main, md: 'transparent' },
        borderTop: {
          xs: '1px solid rgba(209, 209, 209, 0.32)',
          md: 'none',
        },
      }}
    >
      <Grid
        size={12}
        sx={{
          alignItems: { xs: 'flex-start', md: 'center' },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'center',
          gap: { xs: 1.5, md: 3 },
        }}
      >
        <Stack
          direction="row"
          sx={{
            gap: { xs: 1.5, md: 3 },
          }}
        >
          <Link
            variant="caption"
            href={env.VITE_PRIVACY_POLICY_URL}
            rel="noreferrer"
            target="_blank"
            sx={{
              textDecoration: 'none',
              color: footerTextColor,
            }}
          >
            {t('components.footer.privacyPolicy')}
          </Link>
          <Link
            variant="caption"
            href={env.VITE_TERMS_OF_SERVICE_URL}
            rel="noreferrer"
            target="_blank"
            sx={{
              textDecoration: 'none',
              color: footerTextColor,
            }}
          >
            {t('components.footer.termsOfService')}
          </Link>
          <Link
            variant="caption"
            href={env.VITE_HUMAN_PROTOCOL_URL}
            target="_blank"
            rel="noreferrer"
            sx={{
              textDecoration: 'none',
              color: footerTextColor,
            }}
          >
            {t('components.footer.humanProtocol')}
          </Link>
        </Stack>
        <Typography variant="caption" sx={{ color: footerTextColor }}>
          {t('components.footer.copyrightNote')}
        </Typography>
      </Grid>
      <Chat displayChatIcon={displayChatIcon} />
    </Grid>
  );
}
