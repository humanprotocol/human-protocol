import React, { useState } from 'react';
import ConnectModal from './ConnectModal';

const LoginView = () => {
  const [viewConnectModal, setViewConnectModal] = useState(false);

  const displayMxConnect = () => {
    setViewConnectModal(!viewConnectModal);
  }

  return (
    <div className='mx-container'>
      <button className="btn btn-primary connect-btn" onClick={displayMxConnect}>
        MultiversX
      </button>
      { viewConnectModal && <ConnectModal />}
    </div>
  );
}

export default LoginView;
