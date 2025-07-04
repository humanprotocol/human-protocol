import { useEffect, useState } from 'react';

import Stack from '@mui/material/Stack';
import { AxiosError } from 'axios';
import { useLocation, useParams } from 'react-router-dom';

import handleErrorMessage from '@/shared/lib/handleErrorMessage';
import { getNetwork } from '@/shared/lib/networks';
import useGlobalFiltersStore from '@/shared/store/useGlobalFiltersStore';
import EscrowAddressIcon from '@/shared/ui/icons/EscrowAddressIcon';
import WalletIcon from '@/shared/ui/icons/WalletIcon';
import Loader from '@/shared/ui/Loader';
import ShadowIcon from '@/shared/ui/ShadowIcon';

import useAddressDetails from '../api/useAddressDetails';
import type { AddressDetails } from '../model/addressDetailsSchema';

import Clipboard from './Clipboard';
import EscrowAddress from './EscrowAddress';
import NothingFound from './NothingFound';
import OperatorAddress from './OperatorAddress';
import WalletAddress from './WalletAddress';
import WalletTransactionsTable from './WalletTransactionsTable';

enum ParamsStatus {
  LOADING = 'loading',
  ERROR = 'error',
  SUCCESS = 'success',
}

const renderCurrentResultType = (
  addressDetails: AddressDetails,
  tokenId: string | undefined
) => {
  const type = Object.keys(addressDetails)[0] as
    | keyof AddressDetails
    | undefined;

  const renderType: Record<
    keyof AddressDetails,
    { title: string; icon: JSX.Element }
  > = {
    operator: {
      title: 'Wallet Address',
      icon: <WalletIcon />,
    },
    escrow: {
      title: 'Escrow Address',
      icon: <EscrowAddressIcon />,
    },
    wallet: {
      title: 'Wallet Address',
      icon: <WalletIcon />,
    },
  };

  if (type == null) {
    return null;
  }

  return (
    <>
      <ShadowIcon img={renderType[type].icon} title={renderType[type].title} />
      <Clipboard value={tokenId ?? ''} />
    </>
  );
};

const ResultError = ({ error }: { error: unknown }) => {
  if (error instanceof AxiosError && error.response?.status === 400) {
    return (
      <Stack sx={{ paddingTop: '2rem' }}>
        <NothingFound />
      </Stack>
    );
  }
  return <Stack sx={{ paddingTop: '2rem' }}>{handleErrorMessage(error)}</Stack>;
};

const SearchResults = () => {
  const [paramsStatus, setParamsStatus] = useState<ParamsStatus>(
    ParamsStatus.LOADING
  );
  const location = useLocation();
  const { chainId: urlChainId, address: urlAddress } = useParams();
  const { address, chainId, setAddress, setChainId } = useGlobalFiltersStore();
  const { data, status, error } = useAddressDetails(chainId, address);

  useEffect(() => {
    setParamsStatus(ParamsStatus.LOADING);
  }, [location]);

  useEffect(() => {
    if (paramsStatus === ParamsStatus.SUCCESS) return;
    if (urlAddress) {
      setAddress(urlAddress);
    } else {
      setParamsStatus(ParamsStatus.ERROR);
      return;
    }
    const chainIdFromUrl = Number(urlChainId);
    if (
      !Number.isNaN(chainIdFromUrl) &&
      chainIdFromUrl &&
      getNetwork(chainIdFromUrl)
    ) {
      setChainId(chainIdFromUrl);
    } else {
      setParamsStatus(ParamsStatus.ERROR);
    }
  }, [
    address,
    chainId,
    paramsStatus,
    setAddress,
    setChainId,
    urlAddress,
    urlChainId,
  ]);

  useEffect(() => {
    if (address && chainId && paramsStatus !== ParamsStatus.SUCCESS) {
      setParamsStatus(ParamsStatus.SUCCESS);
    }
  }, [address, chainId, paramsStatus]);

  if (
    paramsStatus === ParamsStatus.LOADING ||
    (status === 'pending' && !data)
  ) {
    return <Loader height="auto" paddingTop="2rem" />;
  }

  if (paramsStatus === ParamsStatus.ERROR) {
    return <Stack pt="2rem">Something went wrong</Stack>;
  }

  if (status === 'error') {
    return <ResultError error={error} />;
  }

  const showTransactions = !!data.wallet || !!data.operator;

  const walletData =
    data.wallet ||
    (data.operator && data.operator.role === null ? data.operator : undefined);

  return (
    <>
      <Stack
        mt={{ xs: 1, md: 4 }}
        mb={4}
        direction={{ xs: 'column', md: 'row' }}
        gap={{ xs: 1, md: 3 }}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        {renderCurrentResultType(data, address)}
      </Stack>

      {data.operator && data.operator.role ? (
        <OperatorAddress data={data.operator} />
      ) : null}
      {walletData ? <WalletAddress data={walletData} /> : null}
      {data.escrow && <EscrowAddress data={data.escrow} />}
      {showTransactions && <WalletTransactionsTable />}
    </>
  );
};

export default SearchResults;
