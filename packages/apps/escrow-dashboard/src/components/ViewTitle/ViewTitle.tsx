import { Box, Typography } from '@mui/material';
import { FC } from 'react';

type ViewTitleProps = {
  title: string;
  iconUrl: string;
};

export const ViewTitle: FC<ViewTitleProps> = ({ title, iconUrl }) => (
  <Box display="flex" alignItems="center" height="92px" marginLeft="-32px">
    <Box height="100%">
      <img src={iconUrl} alt="network" />
    </Box>
    <Typography variant="h4" color="primary">
      {title}
    </Typography>
  </Box>
);
