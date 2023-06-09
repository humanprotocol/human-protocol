import { Box, Typography } from '@mui/material';

import { CardContainer } from '../Cards';

export const NewsView = ({
  title,
  content,
  image,
}: {
  title: string;
  content: string;
  image?: string;
}) => (
  <CardContainer>
    <Box>
      <Typography variant="h6" color="primary" mb={2}>
        {title}
      </Typography>
      <Typography variant="body2" color="primary" maxWidth={450}>
        {content}
      </Typography>
    </Box>
    {image && (
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: 8, lg: 25 },
          right: { xs: 14, lg: 28 },
          display: { xs: 'none', sm: 'block' },
        }}
      >
        <img src={image} alt="lbank" />
      </Box>
    )}
  </CardContainer>
);
