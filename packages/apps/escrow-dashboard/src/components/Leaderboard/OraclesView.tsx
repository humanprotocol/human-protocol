import { Box, Chip, Grid, Typography } from '@mui/material';
// import { styled } from '@mui/material/styles';
import React from 'react';
import { CardContainer } from '../Cards';
import { ViewTitle } from '../ViewTitle';
import userSvg from 'src/assets/user.svg';

export const OraclesView = () => {
  return (
    <Box mt={18}>
      <ViewTitle title="Oracles" iconUrl={userSvg} />
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4}>
          <CardContainer sxProps={{ padding: 6 }}>
            <Box>
              <Box>
                <Chip label="HUMAN Protocol core architecture" />
              </Box>
              <Typography color="primary">Exchange Oracle</Typography>
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
            </Box>
          </CardContainer>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardContainer sxProps={{ padding: 6 }}>
            <Box>
              <Chip label="HUMAN Protocol core architecture" />
            </Box>
            <Typography color="primary">Recording Oracle</Typography>
            <Typography color="primary" component="div">
              <ul>
                <li>
                  The Recording Oracle is where task solutions get the green
                  light.
                </li>
                <li>
                  It is storing, and recording task solutions on the blockchain
                </li>
                <li>
                  From quality checks to reputation adjustments, it's the
                  assurance you need for dependable results.
                </li>
              </ul>
            </Typography>
          </CardContainer>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardContainer sxProps={{ padding: 6 }}>
            <Box>
              <Chip label="HUMAN Protocol core architecture" />
            </Box>
            <Typography color="primary">Reputation Oracle</Typography>
            <Typography color="primary" component="div">
              <ul>
                <li>
                  The Reputation Oracle is the trust engine of the HUMAN
                  Protocol.
                </li>
                <li>
                  It cross-checks validated solutions from the Recording Oracle,
                  adjusts reputation scores, and manages payments.
                </li>
                <li>
                  It's the final seal of quality and trust within the ecosystem.
                </li>
              </ul>
            </Typography>
          </CardContainer>
        </Grid>
      </Grid>
    </Box>
  );
};
