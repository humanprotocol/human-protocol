import {
  useWeb3ModalTheme,
  Web3Button,
  Web3Modal,
  Web3NetworkSwitch,
} from '@web3modal/react';
import { useAccount } from 'wagmi';
import './App.css';
import { Escrow } from './components/Escrow';
import { ethereumClient, projectId } from './connectors/connectors';

function App() {
  const { setTheme } = useWeb3ModalTheme();
  const { isConnected } = useAccount();

  setTheme({
    themeMode: 'light',
  });

  return (
    <>
      <div className="App">
        <header className="App-header">
          {isConnected && <Web3Button icon="show" balance="show" />}
        </header>
        <div className="App-body">
          {!isConnected && (
            <>
              <h1>Select Network</h1>
              <Web3NetworkSwitch />
            </>
          )}
          {isConnected && <Escrow />}
        </div>
      </div>
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </>
  );
}

export default App;
