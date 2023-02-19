import React, { useState, useEffect } from 'react';
import getWeb3 from './utils/web3';
import Escrow from './components/escrow';
import './App.css';
import {
  DappProvider,
  AxiosInterceptorContext
} from '@multiversx/sdk-dapp/wrappers';
import { EnvironmentsEnum } from '@multiversx/sdk-dapp/types';
import {
  walletConnectV2ProjectId ,
  sampleAuthenticatedDomains
} from './constants/constants';
import {
  TransactionsToastList,
  SignTransactionsModals,
  NotificationModal
} from '@multiversx/sdk-dapp/UI';
import { useGetIsLoggedIn } from '@multiversx/sdk-dapp/hooks';
import LoginView from './components/mx/Login';
import { logout } from '@multiversx/sdk-dapp/utils';


function App() {
  const web3 = getWeb3();
  const [isMetamaskInstalled, setIsMetamaskInstalled] = useState(false);
  const [isMetamaskConnected, setIsMetamaskConnected] = useState(false);
  const isMxLoggedIn = useGetIsLoggedIn();

  useEffect(() => {
    (async function () {
      const { ethereum } = window;
      if (typeof ethereum !== 'undefined' && ethereum.isMetaMask) {
        setIsMetamaskInstalled(true);
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
          setIsMetamaskConnected(true);
        }
      }
    })();
  }, [web3.eth]);

  const connect = async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    setIsMetamaskConnected(true);
  }

  const handleLogout = () => {
    logout(`${window.location.origin}/`);
  };

  return (
    <AxiosInterceptorContext.Provider>
      <AxiosInterceptorContext.Interceptor
        authenticatedDomanis={sampleAuthenticatedDomains}
      >
        <DappProvider
          environment={EnvironmentsEnum.testnet}
          customNetworkConfig={{
            name: 'customConfig',
            apiTimeout: 3000,
            walletConnectV2ProjectId
          }}>
            <AxiosInterceptorContext.Listener />
            <TransactionsToastList />
            <NotificationModal />
            <SignTransactionsModals className='custom-class-for-modals' />
            <div className="App">
              <header className="App-header">
                { !isMetamaskInstalled && (<p> Metamask not installed</p>) }
                { (!isMetamaskConnected && !isMxLoggedIn) && (<button onClick={connect}> Connect </button>) }
                { (isMetamaskConnected || isMxLoggedIn) && <Escrow /> }
                { (!isMetamaskConnected && !isMxLoggedIn) &&
                  <LoginView />
                }
                { isMxLoggedIn && <button className='btn btn-link' onClick={handleLogout}> Logout </button> }
              </header>
            </div>
        </DappProvider>
      </AxiosInterceptorContext.Interceptor>
    </AxiosInterceptorContext.Provider>
  );
}

export default App;