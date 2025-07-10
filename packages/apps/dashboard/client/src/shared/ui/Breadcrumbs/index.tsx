import type { FC } from 'react';

import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';

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
