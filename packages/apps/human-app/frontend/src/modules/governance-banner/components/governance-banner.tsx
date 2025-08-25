import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Box, Grid, Link as MuiLink, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { env } from '@/shared/env';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useWorkerIdentityVerificationStatus } from '@/modules/worker/profile/hooks';
import { useProposalQuery } from '../hooks/use-proposal-query';
import { formatCountdown } from '../../../shared/utils/time';
import { type ProposalResponse } from '../services/governance.service';

export type ProposalStatus = 'pending' | 'active';

function getProposalStatus(proposal: ProposalResponse): ProposalStatus {
  const now = Date.now();
  const { voteStart, voteEnd } = proposal;
  if (voteStart <= now && now < voteEnd) return 'active';
  return 'pending';
}
export function GovernanceBanner() {
  const { t } = useTranslation();
  const { data: proposal, isLoading, isError } = useProposalQuery();
  const { isVerificationCompleted } = useWorkerIdentityVerificationStatus();
  const { colorPalette } = useColorMode();
  const { text, background } = colorPalette.banner;
  const [timeRemaining, setTimeRemaining] = useState('00:00:00');

  useEffect(() => {
    if (!proposal) return;
    const { voteStart, voteEnd } = proposal;

    const timer = setInterval(() => {
      const currentStatus = getProposalStatus(proposal);
      setTimeRemaining(
        formatCountdown(currentStatus === 'pending' ? voteStart : voteEnd)
      );
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [proposal]);

  if (!isVerificationCompleted || isLoading || isError || !proposal) {
    return null;
  }

  const status = getProposalStatus(proposal);

  const totalVotes =
    proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;

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
            {status === 'pending'
              ? t('governance.timeToStart', 'Voting starts in')
              : t('governance.timeToReveal', 'Time to reveal vote')}
            :
          </Typography>
          <Typography variant="body1" ml={1} color={text.primary}>
            {timeRemaining}
          </Typography>
        </Box>
        {status === 'active' && (
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
