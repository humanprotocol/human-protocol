import { Grid, Link, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { colorPalette } from '@/styles/color-palette';
import { env } from '@/shared/env';
import { Chat } from '@/pages/homepage/components/chat';
import { breakpoints } from '@/styles/theme';

interface FooterProps {
  displayChatIcon?: boolean;
  isProtected?: boolean;
}
export function Footer({ isProtected, displayChatIcon = true }: FooterProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile('md');

  const parseLeftPadding = () => {
    if (isMobile) {
      return '0';
    }
    if (isProtected) {
      return '200px';
    }
    return '44px';
  };

  return (
    <Grid
      component="footer"
      container
      sx={{
        pr: isMobile ? 0 : '44px',
        pl: parseLeftPadding(),
        pb: isMobile ? 0 : '44px',
        pt: '32px',
        [breakpoints.mobile]: {
          pr: 0,
          pl: 0,
          pb: 0,
          pt: 0,
          padding: '32px',
        },
      }}
    >
      <Grid
        alignItems="flex-start"
        display="flex"
        flexDirection="column"
        gap="24px"
        item
        justifyContent="center"
        xs={isMobile ? 12 : 11}
      >
        <Stack
          direction={isMobile ? 'column' : 'row'}
          sx={{
            gap: '24px',
            [breakpoints.mobile]: {
              gap: '24px',
            },
          }}
        >
          <Link
            href={env.VITE_PRIVACY_POLICY_URL}
            rel="noreferrer"
            target="_blank"
            underline="none"
          >
            <Typography color={colorPalette.text.secondary} variant="caption">
              {t('components.footer.privacyPolicy')}
            </Typography>
          </Link>
          <Link
            href={env.VITE_TERMS_OF_SERVICE_URL}
            rel="noreferrer"
            target="_blank"
            underline="none"
          >
            <Typography color={colorPalette.text.secondary} variant="caption">
              {t('components.footer.termsOfService')}
            </Typography>
          </Link>
          <Link
            href={env.VITE_HUMAN_PROTOCOL_URL}
            rel="noreferrer"
            sx={{
              mb: isMobile ? '10px' : 0,
            }}
            target="_blank"
            underline="none"
          >
            <Typography color={colorPalette.text.secondary} variant="caption">
              {t('components.footer.humanProtocol')}
            </Typography>
          </Link>
          {isMobile ? (
            <Typography color={colorPalette.text.secondary} variant="caption">
              {t('components.footer.copyrightNote')}
            </Typography>
          ) : null}
        </Stack>
        {!isMobile ? (
          <Typography color={colorPalette.text.secondary} variant="caption">
            {t('components.footer.copyrightNote')}
          </Typography>
        ) : null}
      </Grid>
      <Grid
        item
        sx={{
          position: isMobile ? 'absolute' : 'relative',
          right: isMobile ? '32px' : 0,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
        xs={isMobile ? 12 : 1}
      >
        <Chat displayChatIcon={displayChatIcon} />
      </Grid>
    </Grid>
  );
}
