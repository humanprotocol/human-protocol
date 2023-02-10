import * as React from 'react';
import { Box, Typography } from '@mui/material';

import lbankSvg from 'src/assets/lbank.svg';
import { CardContainer } from 'src/components/Cards/Container';

export const NewsContainer: React.FC<{}> = (): React.ReactElement => {
  return (
    <Box id="news-container" sx={{ height: '100%' }}>
      <CardContainer>
        <Box>
          <Typography variant="h6" color="primary" mb={2}>
            HMT listed on Lbank
          </Typography>
          <Typography variant="body2" color="primary" maxWidth={450}>
            Following your decisive community vote we're pleased to announce HMT
            will be listed on LBank Exchange.
          </Typography>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: 8, lg: 25 },
            right: { xs: 14, lg: 28 },
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <img src={lbankSvg} alt="lbank" />
        </Box>
      </CardContainer>
    </Box>
  );
};

export default NewsContainer;
