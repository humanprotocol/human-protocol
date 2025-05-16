import { FC } from 'react';

import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

const Breadcrumbs: FC<{ title?: string }> = ({ title }) => {
  return (
    <Box display="flex" alignItems="center" gap={1} mb={{ xs: 3, md: 4 }}>
      <Link
        to="/"
        component={RouterLink}
        color="text.secondary"
        sx={{
          textDecoration: 'unset',
          '&:visited': { color: 'text.secondary' },
        }}
      >
        Dashboard
      </Link>
      <KeyboardArrowRightIcon color="primary" />
      <Typography component="span">{title}</Typography>
    </Box>
  );
};

export default Breadcrumbs;
