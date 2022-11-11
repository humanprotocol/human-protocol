import * as React from 'react';

export const AppNetworkContext = React.createContext({
  network: 'polygon',
  // eslint-disable-next-line no-unused-vars
  setNetwork: (value: string): void => {},
});
