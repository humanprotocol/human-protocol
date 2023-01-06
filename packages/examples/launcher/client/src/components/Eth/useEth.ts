import { config } from 'config';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { setTx } from '../../services/redux/slices/jobSlice';
import { store } from '../../services/redux/store';

const HMTokenAbi = require('../../contracts/HMTokenAbi.json');

export const transferERC20 = async ({
  address,
  fundAmount,
  backdropCallback,
}: {
  address: string;
  fundAmount: number;
  backdropCallback: any;
}) => {
  try {
    if (!window.ethereum) {
      toast.error(
        'Connect your Metamask wallet to update the message on the blockchain',
        {
          position: 'top-right',
        }
      );
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);

    const accountAddress = accounts[0];
    const signer = provider.getSigner();
    const value = ethers.utils.parseEther(String(fundAmount));

    const contract = new ethers.Contract(
      config.hmtAddress ?? '',
      HMTokenAbi,
      signer
    );

    try {
      const tx = await contract.transfer(address, value, {
        from: accountAddress,
      });
      const receipt = await tx.wait();

      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, 5000);
      });
      store.dispatch(setTx({ hash: receipt.transactionHash }));
    } catch (err) {
      backdropCallback(false);
      toast.error('Please try again', {
        position: 'top-right',
      });
    }
  } catch (err) {
    backdropCallback(false);
    console.log(err);
  }
};
