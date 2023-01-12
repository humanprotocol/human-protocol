import React from 'react';
import Stake from './stake';
import Approve from './approve';

import './index.css';

export default function Staking() {
  return (
    <div >
      <div> <Approve /> </div>
      <div> <Stake /> </div>
    </div>
  )
}
