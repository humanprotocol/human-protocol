import KVStore from '@human-protocol/core/abis/KVStore.json';
import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { useState, useEffect, FC } from 'react';
import { useAccount, useReadContract } from 'wagmi';

import { AfterConnect } from './AfterConnect';
import { Dashboard } from './Dashboard';
import { MainPage } from './MainPage';
import { useNotification } from 'src/providers/NotificationProvider';

export const KvstoreView: FC = () => {
  const { isConnected, address, chain } = useAccount();
  const [publicKey, setPublicKey] = useState<string>('');
  const [step, setStep] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [pubkeyExist, setPubkeyExist] = useState<boolean>(false);
  const { data, refetch } = useReadContract({
    address: NETWORKS[chain?.id as ChainId]?.kvstoreAddress as `0x${string}`,
    abi: KVStore,
    functionName: 'get',
    args: [address, 'public_key'],
  });
  const { showMessage } = useNotification();

  useEffect(() => {
    if (publicKey?.trim().length === 0) {
      setStep(0);
      setPage(0);
    }
    setPublicKey(data as string);
    if (data as string) {
      setPubkeyExist(true);
    }
  }, [data, chain, publicKey]);

  useEffect(() => {
    if (isConnected && !chain) {
      showMessage(
        'Unsupported network.',
        'Please switch to the one of the supported networks.',
        'error'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, chain]);

  return (
    <>
      {(!isConnected || !chain) && <MainPage />}
      {isConnected && publicKey?.trim().length === 0 && (
        <AfterConnect
          refetch={refetch}
          setPublicKey={setPublicKey}
          pubkeyExist={pubkeyExist}
          step={step}
          setStep={setStep}
          page={page}
          setPage={setPage}
        />
      )}
      {isConnected && publicKey?.trim().length > 0 && (
        <Dashboard
          setStep={setStep}
          setPage={setPage}
          publicKey={publicKey}
          refetch={refetch}
          setPublicKey={setPublicKey}
        />
      )}
    </>
  );
};
