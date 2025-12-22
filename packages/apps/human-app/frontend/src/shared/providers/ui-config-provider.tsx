import React, { createContext, useContext, useMemo } from 'react';
import { useGetUiConfig } from '../hooks/use-get-ui-config';
import { UiConfig } from '../services/ui-config.service';

interface UiConfigContextType {
  uiConfig: UiConfig | undefined;
  isUiConfigLoading: boolean;
  isUiConfigError: boolean;
  error: Error | null;
}

const UiConfigContext = createContext<UiConfigContextType | undefined>(
  undefined
);

export function UiConfigProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { data, isLoading, error, isError } = useGetUiConfig();

  const contextValue = useMemo(
    () => ({
      uiConfig: data,
      isUiConfigLoading: isLoading,
      isUiConfigError: isError,
      error,
    }),
    [data, isLoading, isError, error]
  );

  return (
    <UiConfigContext.Provider value={contextValue}>
      {children}
    </UiConfigContext.Provider>
  );
}

export const useUiConfig = () => {
  const context = useContext(UiConfigContext);
  if (!context) {
    throw new Error('useUiConfig must be used within a UiConfigProvider');
  }
  return context;
};
