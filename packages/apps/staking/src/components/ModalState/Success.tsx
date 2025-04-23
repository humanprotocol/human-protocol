import { FC, PropsWithChildren } from 'react';
import { Box } from '@mui/material';

import { SuccessIcon } from '../../icons';
import { colorPalette } from '../../assets/styles/color-palette';

const ModalSuccess: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb={2}
        p="3px"
        color={colorPalette.whiteBackground}
        bgcolor={colorPalette.success.main}
        borderRadius={100}
      >
        <SuccessIcon sx={{ width: 34, height: 34 }} />
      </Box>
      {children}
    </>
  );
};

export default ModalSuccess;
