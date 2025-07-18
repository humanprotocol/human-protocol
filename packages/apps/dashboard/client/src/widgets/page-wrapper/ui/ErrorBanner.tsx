import ErrorIcon from '@mui/icons-material/Error';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const ErrorBanner = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection={{ xs: 'column', md: 'row' }}
      gap={1}
      mx={{ xs: 0, sm: -3, lg: -7 }}
      py={0.5}
      px={1}
      color="#000"
      textAlign={{ xs: 'center', md: 'unset' }}
      bgcolor="warning.main"
    >
      <ErrorIcon sx={{ fontSize: { xs: 24, md: 16 } }} />
      <Typography variant="body2" fontWeight={600}>
        We are experiencing Subgraph downtime impacting the Polygon data we show
        here - We will be back soon!
      </Typography>
    </Box>
  );
};

export default ErrorBanner;
