import type { ReactNode } from 'react';
import { createContext, useMemo, useState } from 'react';

interface RegisteredOraclesContextProps {
  registeredOracles: string[] | undefined;
  setRegisteredOracles: React.Dispatch<
    React.SetStateAction<string[] | undefined>
  >;
}

export const RegisteredOraclesContext = createContext<
  RegisteredOraclesContextProps | undefined
>(undefined);

export function RegisteredOraclesProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [registeredOracles, setRegisteredOracles] = useState<
    string[] | undefined
  >(undefined);

  const oraclesContextValue = useMemo(
    () => ({ registeredOracles, setRegisteredOracles }),
    [registeredOracles, setRegisteredOracles]
  );

  return (
    <RegisteredOraclesContext.Provider value={oraclesContextValue}>
      {children}
    </RegisteredOraclesContext.Provider>
  );
}
