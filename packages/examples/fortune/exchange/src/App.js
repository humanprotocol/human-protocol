import React, {useState, useEffect} from 'react';
import getWeb3 from './web3';
import Escrow from './escrow';
import './App.css';


function App() {
  const web3 = getWeb3();
  const [isMetamaskInstalled, setIsMetamaskInstalled] = useState(false);
  const [isMetamaskConnected, setIsMetamaskConnected] = useState(false);
  const init = async () => {
    const {ethereum} = window;
    if (typeof ethereum !== 'undefined' && ethereum.isMetaMask ) {
      setIsMetamaskInstalled(true);
      const accounts = await web3.eth.getAccounts();
      if (accounts.length > 0) {
        setIsMetamaskConnected(true);
      }
    }
  }

  useEffect(() => {
    init();
  }, []);

  const connect = async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    setIsMetamaskConnected(true);
  }

  return (
    <div className="App">
      <header className="App-header">
        { !isMetamaskInstalled && 
          (<p> Metamask not installed</p>)
        }
        { !isMetamaskConnected &&
          (<button onClick={connect}> Connect </button>)
        }
        {
          isMetamaskConnected && 
          (<Escrow />)
        }
      </header>
    </div>
  );
}

export default App;
