import React from 'react';

import './App.css';
import {
  DappProvider,
  AxiosInterceptorContext
} from '@multiversx/sdk-dapp/wrappers';
import {
  walletConnectV2ProjectId ,
  sampleAuthenticatedDomains,
  MX_ENVIRONMENT
} from './constants/constants';
import {
  TransactionsToastList,
  SignTransactionsModals,
  NotificationModal
} from '@multiversx/sdk-dapp/UI';

import Layout from './components/mx/Layout';


function App() {
  return (
    <AxiosInterceptorContext.Provider>
      <AxiosInterceptorContext.Interceptor
        authenticatedDomanis={sampleAuthenticatedDomains}
      >
        <DappProvider
          environment={MX_ENVIRONMENT}
          customNetworkConfig={{
            name: 'customConfig',
            apiTimeout: 3000,
            walletConnectV2ProjectId
          }}>
            <AxiosInterceptorContext.Listener />
            <TransactionsToastList />
            <NotificationModal />
            <SignTransactionsModals className='custom-class-for-modals' />
            <Layout />
        </DappProvider>
      </AxiosInterceptorContext.Interceptor>
    </AxiosInterceptorContext.Provider>
  );
}

export default App;