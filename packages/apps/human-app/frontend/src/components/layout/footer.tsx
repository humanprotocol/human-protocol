import { Grid, Link, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { env } from '@/shared/env';
import { Chat } from '@/pages/homepage/components/chat';
import { breakpoints } from '@/styles/breakpoints';
import { useColorMode } from '@/hooks/use-color-mode';

interface FooterProps {
  displayChatIcon?: boolean;
  isProtected?: boolean;
}
export function Footer({ isProtected, displayChatIcon = true }: FooterProps) {
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();
  const isMobile = useIsMobile('md');

  const parseLeftPadding = () => {
    if (isMobile) {
      return '0';
    }
    if (isProtected) {
      return '200px';
    }
    return '0';
  };

  return (
    <Grid
      component="footer"
      container
      sx={{
        pr: 0,
        pl: parseLeftPadding(),
        pb: isMobile ? 0 : '32px',
        [breakpoints.mobile]: {
          pr: 0,
          pl: 0,
          pb: 0,
          pt: 0,
          padding: '32px',
          backgroundColor: colorPalette.paper.main,
        },
      }}
    >
      <Grid
        alignItems="flex-start"
        display="flex"
        flexDirection="column"
        item
        justifyContent="center"
        xs={isMobile ? 12 : 11}
      >
        <Stack
          direction={isMobile ? 'column' : 'row'}
          lineHeight="166%"
          sx={{
            gap: '24px',
            [breakpoints.mobile]: {
              gap: '20px',
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
