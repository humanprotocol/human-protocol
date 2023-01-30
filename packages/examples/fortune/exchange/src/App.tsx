import { useAccount, useConnect } from 'wagmi';
import './App.css';
import { Escrow } from './components/Escrow';

function App() {
  const { connector: activeConnector, isConnected } = useAccount();
  const { connect, connectors, isLoading, error, pendingConnector, data } =
    useConnect();

  return (
    <>
      <div className="App">
        {isConnected && <div>Connected to {activeConnector?.name}</div>}
        {isConnected && <div>Address: {data?.account}</div>}
        <header className="App-header">
          <>
            {!isConnected &&
              connectors.map((connector) => (
                <button
                  disabled={!connector.ready}
                  key={connector.id}
                  onClick={() => connect({ connector })}
                >
                  {connector.name}
                  {isLoading &&
                    pendingConnector?.id === connector.id &&
                    ' (connecting)'}
                </button>
              ))}
            {isConnected && <Escrow />}
            {error && <div>{error.message}</div>}
          </>
        </header>
      </div>
    </>
  );
}

export default App;
