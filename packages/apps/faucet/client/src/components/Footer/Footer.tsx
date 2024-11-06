import { Box, Link, Typography, useMediaQuery, useTheme } from '@mui/material';
import { FC } from 'react';

export const Footer: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  return isMobile ? (
    <Box px="28px" py={6}>
      <Box display="flex" flexDirection="column" ml={2} mt={4}>
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
        py: 5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Link
          href="https://www.humanprotocol.org/privacy-policy"
          sx={{ textDecoration: 'none' }}
        >
          <Typography color="text.secondary" variant="caption" lineHeight={1}>
            Terms and conditions
          </Typography>
        </Link>
      </Box>
      <Typography color="text.secondary" variant="caption">
        © {new Date().getFullYear()} HPF. HUMAN Protocol® is a registered
        trademark
      </Typography>
    </Box>
  );
};
