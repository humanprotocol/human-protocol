import { FC } from 'react';
import { Box, Typography } from '@mui/material';

import { colorPalette } from '../../assets/styles/color-palette';
import { CloseIcon } from '../../icons';

const ModalError: FC = () => {
  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb={2}
        p="3px"
        color={colorPalette.whiteBackground}
        bgcolor={colorPalette.error.main}
        borderRadius={100}
      >
        <CloseIcon sx={{ width: 34, height: 34 }} />
      </Box>
      <Typography variant="subtitle2" color={colorPalette.error.main}>
        An error occurred, please try again.
      </Typography>
    </>
  );
};

export default ModalError;
