/* eslint-disable no-nested-ternary */
/* eslint-disable react/react-in-jsx-scope */
import * as React from 'react';
import { Box } from '@mui/material';

interface IDisplayMask {
  active: boolean | undefined;
  account: string | null | undefined;
  installed: boolean;
}

const conditionMessage = (
  active: boolean | undefined,
  account: string | null | undefined,
  installed: boolean
) => {
  return !installed ? (
    <span>You have not installed MetaMask</span>
  ) : active ? (
    <span>active</span>
  ) : (
    <span>No connection</span>
  );
};

export const DisplayMask: React.FC<IDisplayMask> = ({
  active,
  account,
  installed,
}) => {
  const message = conditionMessage(active, account, installed);
  return <Box>{message}</Box>;
};
