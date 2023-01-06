/* eslint-disable no-nested-ternary */
/* eslint-disable react/react-in-jsx-scope */
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { Box } from '@mui/material';
import { useMetaMask } from './hooks';
import { StyledButton } from '../ButtonLink/LinkButton';
import { authSlice } from '../../services/redux/slices/authSlice';
import { StyledButtonConnection } from './style';

interface IWalletConnector {
  children?: React.ReactNode;
}
export const WalletConnector: React.FC<IWalletConnector> = () => {
  const { active, connect, disconnect, installed, downloadApp } = useMetaMask();
  const onConnect = () => {
    connect();
  };

  const onDisconnect = () => {
    disconnect();
  };

  const dispatch = useDispatch();

  React.useEffect(() => {
    if (active) {
      dispatch(
        authSlice.actions.setMetaMaskConnection({ isMetaMaskConnected: true })
      );
    } else if (!active) {
      dispatch(
        authSlice.actions.setMetaMaskConnection({ isMetaMaskConnected: false })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '160px',
        }}
      >
        {!installed ? (
          <StyledButton
            id="positioned-button"
            aria-haspopup="true"
            onClick={downloadApp}
          >
            InstallMetaMask
          </StyledButton>
        ) : active ? (
          <StyledButtonConnection
            id="positioned-button"
            aria-haspopup="true"
            onClick={onDisconnect}
          >
            Disable
          </StyledButtonConnection>
        ) : (
          <>
            <StyledButtonConnection
              id="positioned-button"
              aria-haspopup="true"
              onClick={onConnect}
            >
              Connect to MetaMask
            </StyledButtonConnection>
          </>
        )}
        {/* <DisplayMask active={active} installed={installed} account={account} /> */}
      </Box>
    </>
  );
};
