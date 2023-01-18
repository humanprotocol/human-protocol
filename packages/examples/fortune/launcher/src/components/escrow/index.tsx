import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import React, { useEffect } from 'react';
import { useAccount } from 'wagmi';
import Create from './create';

import {
  PaymentMethod,
  useLauncherConfig,
} from 'src/contexts/LauncherConfigContext';

export default function Escrow() {
  const launcherConfig = useLauncherConfig();
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();

  useEffect(() => {
    if (launcherConfig?.paymentMethod === 'Crypto') {
      console.log('xxx');
      openConnectModal?.();
    }
  }, [launcherConfig?.paymentMethod]);

  return (
    <div className="container max-w-lg mx-auto pt-8">
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Select the payment method
        </label>
        <select
          value={launcherConfig?.paymentMethod}
          onChange={(e) =>
            launcherConfig?.setPaymentMethod?.(e.target.value as PaymentMethod)
          }
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >
          <option value="Fiat">Fiat</option>
          <option value="Crypto">Crypto</option>
        </select>
        {launcherConfig?.paymentMethod === 'Crypto' && (
          <div className="mt-4">
            <ConnectButton accountStatus="address" />
          </div>
        )}
      </div>
      <Create />
      {/* <div className="escrow-container-item">
        <View />
      </div> */}
    </div>
  );
}
