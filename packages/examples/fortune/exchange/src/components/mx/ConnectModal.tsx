import React from 'react';
import {
  ExtensionLoginButton,
  WalletConnectLoginButton,
  WebWalletLoginButton,
  LedgerLoginButton
} from '@multiversx/sdk-dapp/UI';

import './connect.css';
import { walletConnectV2ProjectId } from 'src/constants/constants';

const ConnectModal = () => {

  const commonProps = {
    callbackRoute: '/',
    nativeAuth: true
  };

  return (
   <div className='mx-login'>
    <p>Connect using MultiversX</p>
    <WalletConnectLoginButton
      loginButtonText='xPortal App'
      {...commonProps}
      {...(walletConnectV2ProjectId
        ? {
            isWalletConnectV2: true
          }
        : {})}
    />
    <ExtensionLoginButton loginButtonText='xDeFi Wallet' {...commonProps}/>
    <WebWalletLoginButton loginButtonText='xWeb Wallet' {...commonProps} />
    <LedgerLoginButton loginButtonText='Ledger' {...commonProps} />
   </div>
  );
};

export default ConnectModal;
