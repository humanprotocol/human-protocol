import { useWeb3React } from '@web3-react/core';

import { useEffect, useState } from 'react';
import { injected } from './connectors';

export const useMetaMask = () => {
  const [installed, setInstalled] = useState<boolean>(false);
  const { active, account, activate, deactivate } = useWeb3React();
  const connect = async () => {
    try {
      await activate(injected);
    } catch (ex) {
      console.log(ex);
    }
  };

  useEffect(() => {
    connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = async () => {
    try {
      deactivate();
    } catch (ex) {
      console.log(ex);
    }
  };

  useEffect(() => {
    const { ethereum } = window;
    if (ethereum && ethereum.isMetaMask) {
      setInstalled(true);
    } else {
      setInstalled(false);
    }

    const connectWalletOnPageLoad = async () => {
      if (localStorage?.getItem('isWalletConnected') === 'true') {
        try {
          await activate(injected);
        } catch (ex) {
          console.log(ex);
        }
      }
    };
    connectWalletOnPageLoad();
  }, [activate]);

  const downloadApp = () =>
    window.open(
      'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn/related?hl=en'
    );

  return {
    active,
    account,
    installed,
    connect,
    activate,
    disconnect,
    downloadApp,
  };
};
