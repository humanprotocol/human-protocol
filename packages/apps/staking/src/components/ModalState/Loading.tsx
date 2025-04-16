import { FC } from 'react';
import { CircularProgress } from '@mui/material';

const ModalLoading: FC = () => {
  return <CircularProgress size={40} color="primary" />;
};

export default ModalLoading;
