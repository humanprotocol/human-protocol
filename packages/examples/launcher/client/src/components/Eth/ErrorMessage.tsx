import { Box } from '@mui/material';
import * as React from 'react';

interface IErrorMessage {
  message: string;
}
export const ErrorMessage: React.FC<IErrorMessage> = ({ message }) => {
  if (!message) return null;
  console.log(message);
  return <Box style={{ color: '#000' }}>{JSON.stringify(message)}</Box>;
};
