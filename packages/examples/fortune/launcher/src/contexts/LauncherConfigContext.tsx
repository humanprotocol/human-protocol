import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from 'react';

export type PaymentMethod = 'Fiat' | 'Crypto';

type EscrowFormData = {
  network: string;
  title: string;
  description: string;
  fortunesRequested: string;
  tokenForFunding: string;
  fundAmount: number;
  jobRequesterAddress: string;
};

type LauncherConfigContextType = {
  paymentMethod: PaymentMethod;
  escrowFormData?: EscrowFormData;
  setPaymentMethod?: Dispatch<SetStateAction<PaymentMethod>>;
};

const LauncherConfigContext = createContext<LauncherConfigContextType | null>(
  null
);

export const useLauncherConfig = () => useContext(LauncherConfigContext);

export const LauncherConfigProvider = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Fiat');
  const [escrowFormData, setEscrowFormData] = useState<EscrowFormData>();

  return (
    <LauncherConfigContext.Provider
      value={{ paymentMethod, escrowFormData, setPaymentMethod }}
    >
      {children}
    </LauncherConfigContext.Provider>
  );
};
