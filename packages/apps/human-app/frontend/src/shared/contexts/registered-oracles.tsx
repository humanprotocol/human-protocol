import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

interface RegisteredOraclesContextProps {
  registeredOracles: string[] | undefined;
  setRegisteredOracles: React.Dispatch<
    React.SetStateAction<string[] | undefined>
  >;
}

const RegisteredOraclesContext = createContext<
  RegisteredOraclesContextProps | undefined
>(undefined);

export function RegisteredOraclesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [registeredOracles, setRegisteredOracles] = useState<
    string[] | undefined
  >(undefined);

  return (
    <RegisteredOraclesContext.Provider
      value={{
        registeredOracles,
        setRegisteredOracles,
      }}
    >
      {children}
    </RegisteredOraclesContext.Provider>
  );
}

export const useRegisteredOracles = () => {
  const context = useContext(RegisteredOraclesContext);
  if (!context) {
    throw new Error(
      'useRegisteredOracles must be used within a RegisteredOraclesProvider'
    );
  }
  return context;
};
