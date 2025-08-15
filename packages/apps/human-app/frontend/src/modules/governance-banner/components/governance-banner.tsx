import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Box, Grid, Link as MuiLink, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { env } from '@/shared/env';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useWorkerIdentityVerificationStatus } from '@/modules/worker/profile/hooks';
import { useProposalQuery } from '../hooks/use-proposal-query';

export function GovernanceBanner() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useProposalQuery();
  const { isVerificationCompleted } = useWorkerIdentityVerificationStatus();
  const { colorPalette } = useColorMode();
  const { text, background } = colorPalette.banner;
  const [timeRemaining, setTimeRemaining] = useState('00:00:00');

  useEffect(() => {
    if (!data) return;
    const { voteStart, voteEnd } = data;
    if (!voteStart || !voteEnd) return;

    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const target = now < voteStart ? voteStart : voteEnd;
      const diff = target - now;

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
  }, [data]);

  if (!isVerificationCompleted || isLoading || isError || !data) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const isPending = now < data.voteStart;
  const isActive = data.voteStart <= now && now < data.voteEnd;

  const forVotes = isActive ? data.forVotes : 0;
  const againstVotes = isActive ? data.againstVotes : 0;
  const abstainVotes = isActive ? data.abstainVotes : 0;
  const totalVotes = forVotes + againstVotes + abstainVotes;

  return (
    <Grid
      container
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent={{ xs: 'flex-start', sm: 'space-between' }}
      bgcolor={background.primary}
      color={text.secondary}
      borderRadius="8px"
      p={2}
      gap={2}
      mt={{ xs: 0, md: -8 }}
    >
      {/* Left side: Countdown & "X votes" */}
      <Grid
        item
        xs={12}
        sm="auto"
        display="flex"
        alignItems="center"
        flexWrap={{ xs: 'wrap', sm: 'nowrap' }}
        gap={{ xs: 2, md: 0 }}
      >
        <Box display="flex" alignItems="center">
          <AccessTimeIcon sx={{ mr: 1 }} />
          <Typography variant="body2" color={text.secondary}>
            {isPending
              ? t('governance.timeToStart', 'Voting starts in')
              : t('governance.timeToReveal', 'Time to reveal vote')}
            :
          </Typography>
          <Typography variant="body1" ml={1} color={text.primary}>
            {timeRemaining}
          </Typography>
        </Box>
        {isActive && (
          <Typography
            variant="body1"
            ml={{ xs: 0, md: 8 }}
            color={text.primary}
            bgcolor={background.secondary}
            borderRadius="8px"
            padding="4px 8px"
          >
            {totalVotes} {t('governance.votes', 'votes')}
          </Typography>
        )}
      </Grid>

      {/* Right side: "More details" link */}
      <Grid
        item
        xs={12}
        sm
        display="flex"
        justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
      >
        <MuiLink
          href={env.VITE_GOVERNANCE_URL}
          underline="none"
          target="_blank"
          rel="noopener noreferrer"
          color={text.secondary}
          fontWeight={500}
        >
          {t('governance.moreDetails', 'More details')} &rarr;
        </MuiLink>
      </Grid>
    </Grid>
  );
}
