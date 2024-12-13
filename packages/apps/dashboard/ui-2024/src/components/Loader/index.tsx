import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Loader = ({
  height = '100vh',
  paddingTop = 'unset',
}: {
  height?: string;
  paddingTop?: string;
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop,
        height,
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default Loader;
