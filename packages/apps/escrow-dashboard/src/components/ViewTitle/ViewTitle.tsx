import { Box, Typography } from '@mui/material';
import { FC } from 'react';

type ViewTitleProps = {
  title: string;
  iconUrl: string;
  fontSize?: number;
};

export const ViewTitle: FC<ViewTitleProps> = ({
  title,
  iconUrl,
  fontSize = 34,
}) => (
  <Box
    display="flex"
    alignItems="center"
    height={{ xs: '50px', md: '92px' }}
    marginLeft={{ xs: '-16px', md: '-32px' }}
  >
    <Box height="100%">
      <Box
        component="img"
        src={iconUrl}
        alt={title}
        sx={{ width: { xs: '80px', md: '149px' } }}
      />
    </Box>
    <Typography
      variant="h4"
      color="primary"
      whiteSpace="nowrap"
      sx={{ ml: '-1px', fontSize: `${fontSize}px` }}
    >
      {title}
    </Typography>
  </Box>
);
