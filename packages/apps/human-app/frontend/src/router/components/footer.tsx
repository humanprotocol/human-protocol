import { Grid, Link, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { env } from '@/shared/env';
import { Chat } from '@/modules/homepage/components/chat';
import { useColorMode } from '@/shared/contexts/color-mode';

interface FooterProps {
  displayChatIcon?: boolean;
}

export function Footer({ displayChatIcon = true }: FooterProps) {
  const { isDarkMode } = useColorMode();
  const { t } = useTranslation();

  const footerTextColor = isDarkMode ? 'text.secondary' : 'text.auxiliary200';

  return (
    <Grid
      component="footer"
      container
      sx={{
        width: '100%',
        px: { xs: 3, md: 2 },
        py: { xs: 2, md: 3 },
        bgcolor: { xs: 'background.paper', md: 'transparent' },
        borderTop: (theme) => ({
          xs: `1px solid ${theme.palette.border.main}`,
          md: 'none',
        }),
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
