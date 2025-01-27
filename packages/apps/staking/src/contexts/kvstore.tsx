import React, { createContext, useContext } from 'react';
import { useKVStore } from '../hooks/useKVStore';

const KVStoreContext = createContext<ReturnType<typeof useKVStore> | undefined>(
  undefined
);

export const KVStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const kvStore = useKVStore();

  return (
    <KVStoreContext.Provider value={kvStore}>
      {children}
    </KVStoreContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useKVStoreContext = () => {
  const context = useContext(KVStoreContext);
  if (!context) {
    throw new Error('useKVStoreContext must be used within a KVStoreProvider');
  }
  return context;
};
