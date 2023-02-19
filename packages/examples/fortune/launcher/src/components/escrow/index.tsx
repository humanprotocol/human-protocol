import React from 'react';
import Create from './create';
import View from './view';
import { logout } from '@multiversx/sdk-dapp/utils';

import './index.css';
import { useGetIsLoggedIn } from '@multiversx/sdk-dapp/hooks';

export default function Escrow() {



  return (
    <div className="escrow-container">

      <div className="escrow-container-item right-border"> <Create /> </div>
      <div className="escrow-container-item"> <View /> </div>
    </div>
  )
}
