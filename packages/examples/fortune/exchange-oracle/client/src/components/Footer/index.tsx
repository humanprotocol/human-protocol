import { Box, Link, Typography, useMediaQuery, useTheme } from '@mui/material';
import { FC } from 'react';

import { SocialIcons } from '../SocialIcons';

export const Footer: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  return isMobile ? (
    <Box px={4} py={6}>
      <SocialIcons />
      <Box display="flex" flexDirection="column" ml={1} mt={2}>
        <Typography color="text.secondary" variant="caption" lineHeight={1}>
          Terms and conditions
        </Typography>
        <Typography color="text.secondary" variant="caption" mt={1}>
          © {new Date().getFullYear()} HPF. HUMAN Protocol® is a registered
          trademark
        </Typography>
      </Box>
    </Box>
  ) : (
    <Box
      sx={{
        px: 12,
        pt: '12px',
        pb: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Link href="https://www.humanprotocol.org/privacy-policy">
          <Typography
            color="text.secondary"
            variant="caption"
            ml={2.5}
            lineHeight={1}
          >
            Terms and conditions
          </Typography>
        </Link>
      </Box>
      <Typography color="text.secondary" variant="caption">
        © {new Date().getFullYear()} HPF. HUMAN Protocol® is a registered
        trademark
      </Typography>
      <SocialIcons />
    </Box>
  );
};
