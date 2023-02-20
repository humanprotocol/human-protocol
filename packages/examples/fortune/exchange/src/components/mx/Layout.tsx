import React, { useState, useEffect } from 'react';
import getWeb3 from 'src/utils/web3';
import { Escrow } from '../Escrow';
import LoginView from './Login';
import { logout } from '@multiversx/sdk-dapp/utils';
import { useGetAccount } from '@multiversx/sdk-dapp/hooks/account';


function Layout() {
  const web3 = getWeb3();
  const [isMetamaskInstalled, setIsMetamaskInstalled] = useState(false);
  const [isMetamaskConnected, setIsMetamaskConnected] = useState(false);
  const { address } = useGetAccount();
  const isMxLoggedIn2 = Boolean(address);

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
    <div className="App">
      <header className="App-header">
      <div className="App">
        <header className="App-header">
        { !isMetamaskInstalled && (<p> Metamask not installed</p>) }
        { (!isMetamaskConnected && !isMxLoggedIn2) && (<button onClick={connect}> Connect </button>) }
        { (isMetamaskConnected || isMxLoggedIn2) && <Escrow /> }
        { (!isMetamaskConnected && !isMxLoggedIn2) &&
            <LoginView />
        }
        { isMxLoggedIn2 && <button className='btn btn-link' onClick={handleLogout}> Logout </button> }
        </header>
    </div>
      </header>
    </div>
  )
}

export default Layout;
