import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Button, Chip, Grid, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { CardContainer } from '../Cards';
import {
  ExchangeOracleIcon,
  RecordingOracleIcon,
  ReputationOracleIcon,
} from '../Icons';
import { ViewTitle } from '../ViewTitle';
import oraclesImg from 'src/assets/leaderboard/oracles.png';

const OracleIcon = styled(Box)({
  borderRadius: '100%',
  width: '82px',
  height: '82px',
  background: 'rgba(20, 6, 178, 0.04)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const Oracle = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '24px',

  '& h4': {
    width: '100%',
  },

  '& ul': {
    margin: 0,
    paddingLeft: '24px',
  },
});

export const OraclesView = () => {
  return (
    <Box mt={13}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-end">
        <ViewTitle title="Oracles" iconUrl={oraclesImg} fontSize={45} />
        <Typography
          component="div"
          variant="body2"
          color="text.secondary"
          fontWeight={600}
          lineHeight="42px"
        >
          Learn more about oracles
          <Button endIcon={<OpenInNewIcon />} sx={{ ml: '10px' }}>
            Docs
          </Button>
        </Typography>
      </Box>
      <Grid container spacing={4} sx={{ mt: '20px' }}>
        <Grid item xs={12} sm={6} md={4}>
          <CardContainer sxProps={{ padding: 6 }}>
            <Oracle>
              <OracleIcon>
                <ExchangeOracleIcon sx={{ fontSize: '2.5rem' }} />
              </OracleIcon>
              <Box>
                <Chip label="HUMAN Protocol core architecture" />
              </Box>
              <Typography variant="h4" fontWeight={600} color="primary">
                Exchange Oracle
              </Typography>
              <Typography color="primary" component="div">
                <ul>
                  <li>
                    The Exchange Oracle is the HUMAN Protocol's powerhouse,
                    directing tasks to skilled workers and ensuring smooth
                    communication.
                  </li>
                  <li>
                    It validates solutions, provides job updates, and handles
                    cancellations, streamlining the job lifecycle.
                  </li>
                </ul>
              </Typography>
            </Oracle>
          </CardContainer>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardContainer sxProps={{ padding: 6 }}>
            <Oracle>
              <OracleIcon>
                <RecordingOracleIcon sx={{ fontSize: '2.5rem' }} />
              </OracleIcon>
              <Box>
                <Chip label="HUMAN Protocol core architecture" />
              </Box>
              <Typography variant="h4" fontWeight={600} color="primary">
                Recording Oracle
              </Typography>
              <Typography color="primary" component="div">
                <ul>
                  <li>
                    The Recording Oracle is where task solutions get the green
                    light.
                  </li>
                  <li>
                    It is storing, and recording task solutions on the
                    blockchain
                  </li>
                  <li>
                    From quality checks to reputation adjustments, it's the
                    assurance you need for dependable results.
                  </li>
                </ul>
              </Typography>
            </Oracle>
          </CardContainer>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardContainer sxProps={{ padding: 6 }}>
            <Oracle>
              <OracleIcon>
                <ReputationOracleIcon sx={{ fontSize: '2.5rem' }} />
              </OracleIcon>
              <Box>
                <Chip label="HUMAN Protocol core architecture" />
              </Box>
              <Typography variant="h4" fontWeight={600} color="primary">
                Reputation Oracle
              </Typography>
              <Typography color="primary" component="div">
                <ul>
                  <li>
                    The Reputation Oracle is the trust engine of the HUMAN
                    Protocol.
                  </li>
                  <li>
                    It cross-checks validated solutions from the Recording
                    Oracle, adjusts reputation scores, and manages payments.
                  </li>
                  <li>
                    It's the final seal of quality and trust within the
                    ecosystem.
                  </li>
                </ul>
              </Typography>
            </Oracle>
          </CardContainer>
        </Grid>
      </Grid>
    </Box>
  );
};
