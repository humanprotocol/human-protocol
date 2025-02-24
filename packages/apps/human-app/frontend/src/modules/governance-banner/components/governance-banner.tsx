import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Grid, Link as MuiLink, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { env } from '@/shared/env';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useActiveProposalQuery } from '../hooks/use-active-proposal-query';

export function GovernanceBanner() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useActiveProposalQuery();
  const { colorPalette } = useColorMode();
  const [timeRemaining, setTimeRemaining] = useState('00:00:00');
  const isMobile = useIsMobile('lg');

  useEffect(() => {
    if (!data?.deadline) return;

    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = data.deadline - now;

      if (diff <= 0) {
        setTimeRemaining('00:00:00');
      } else {
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        const hh = hours.toString().padStart(2, '0');
        const mm = minutes.toString().padStart(2, '0');
        const ss = seconds.toString().padStart(2, '0');

        setTimeRemaining(`${hh}:${mm}:${ss}`);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [data?.deadline]);

  if (isLoading || isError || !data) {
    return null;
  }

  const forVotes = parseFloat(data.forVotes) || 0;
  const againstVotes = parseFloat(data.againstVotes) || 0;
  const abstainVotes = parseFloat(data.abstainVotes) || 0;
  const totalVotes = forVotes + againstVotes + abstainVotes;

  return (
    <Grid
      container
      alignItems="center"
      sx={{
        backgroundColor: colorPalette.banner.background.primary,
        color: colorPalette.banner.text.secondary,
        borderRadius: '8px',
        padding: '16px',
        my: '12px',
        gap: '16px',
      }}
      direction={isMobile ? 'column' : 'row'}
    >
      {/* Left side: Countdown & "X votes" */}
      <Grid
        item
        xs={12}
        sm="auto"
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <AccessTimeIcon sx={{ mr: 1 }} />
        <Typography
          variant="body2"
          sx={{
            color: colorPalette.banner.text.secondary,
          }}
        >
          {t('governance.timeToReveal', 'Time to reveal vote')}:
        </Typography>

        <Typography
          variant="body1"
          sx={{
            ml: 1,
            color: colorPalette.banner.text.primary,
          }}
        >
          {timeRemaining}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            ml: 8,
            color: colorPalette.banner.text.primary,
            backgroundColor: colorPalette.banner.background.secondary,
            borderRadius: '8px',
            padding: '4px 8px',
          }}
        >
          {totalVotes} {t('governance.votes', 'votes')}
        </Typography>
      </Grid>

      {/* Right side: "More details" link */}
      <Grid
        item
        xs={12}
        sm
        sx={{
          display: 'flex',
          justifyContent: isMobile ? 'flex-start' : 'flex-end',
          mt: isMobile ? 2 : 0,
          mr: isMobile ? 0 : 2,
        }}
      >
        <MuiLink
          href={env.VITE_GOVERNANCE_URL}
          underline="none"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontWeight: 500,
            color: colorPalette.banner.text.secondary,
          }}
        >
          {t('governance.moreDetails', 'More details')} &rarr;
        </MuiLink>
      </Grid>
    </Grid>
  );
}
