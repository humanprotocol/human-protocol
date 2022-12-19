import * as React from 'react';
import { Box, Button, Typography } from '@mui/material';

import { CardContainer } from 'src/components/Cards/Container';
import ViewTitle from 'src/components/ViewTitle';

export const NewsContainer: React.FC<{}> = (): React.ReactElement => {
  return (
    <Box
      id="news-container"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="News" iconUrl="/images/user.svg" />
      </Box>
      <Box mt={{ xs: 4, md: 8 }} flex={1}>
        <CardContainer>
          <Box width={280} mb={{ xs: 5, sm: 16 }}>
            <Typography variant="h3" color="primary" mb={4.5}>
              HMT listed on Lbank
            </Typography>
            <Typography variant="body2" color="primary" mb={4.5}>
              Following your decisive community vote we're pleased to announce
              HMT will be listed on LBank Exchange.
            </Typography>
            <Button variant="outlined">Read Article</Button>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: 40,
              right: 40,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            <img src="/images/lbank.svg" alt="lbank" />
          </Box>
        </CardContainer>
      </Box>
    </Box>
  );
};

export default NewsContainer;
