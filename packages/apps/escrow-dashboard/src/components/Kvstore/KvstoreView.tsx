import React from 'react';
import { MainPage } from './MainPage';
import { AfterConnect } from './AfterConnect';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
export const KvstoreView = (): React.ReactElement => {
  const { isConnected } = useAccount();
  return (
    <>
      {!isConnected && <MainPage />}
      {isConnected && <AfterConnect />}
    </>
  );
};
