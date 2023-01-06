import { toast } from 'react-toastify';
import { networks } from './chainParams';

export const addNetwork = async ({ networkName }: { networkName: string }) => {
  try {
    if (!window.ethereum) throw new Error('No crypto wallet found');
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          ...networks[networkName],
        },
      ],
    });
  } catch (err) {
    const error: any = err;

    toast.error(error.message, {
      position: 'top-right',
    });
  }
};

export const switchNetwork = async ({
  networkName,
}: {
  networkName: string;
}) => {
  try {
    if (!window.ethereum) throw new Error('No crypto wallet found');
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [
        {
          chainId: networks[networkName].chainId,
        },
      ],
    });
  } catch (err) {
    try {
      await addNetwork({ networkName });
    } catch {
      const error: any = err;
      toast.error(error.message, {
        position: 'top-right',
      });
    }
  }
};
