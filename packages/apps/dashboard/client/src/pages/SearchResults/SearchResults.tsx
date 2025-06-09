import { useEffect, useState } from 'react';

import Stack from '@mui/material/Stack';
import { AxiosError } from 'axios';
import { useLocation, useParams } from 'react-router-dom';

import Breadcrumbs from '@/components/Breadcrumbs';
import Clipboard from '@/components/Clipboard';
import { EscrowAddressIcon } from '@/components/Icons/EscrowAddressIcon';
import { WalletIcon } from '@/components/Icons/WalletIcon';
import Loader from '@/components/Loader';
import NothingFound from '@/components/NothingFound';
import PageWrapper from '@/components/PageWrapper';
import SearchBar from '@/components/SearchBar/SearchBar';
import ShadowIcon from '@/components/ShadowIcon';
import EscrowAddress from '@/pages/SearchResults/EscrowAddress';
import RoleDetails from '@/pages/SearchResults/RoleDetails/RoleDetails';
import WalletAddress from '@/pages/SearchResults/WalletAddress';
import {
  AddressDetails,
  useAddressDetails,
} from '@/services/api/use-address-details';
import { handleErrorMessage } from '@/services/handle-error-message';
import { getNetwork } from '@/utils/config/networks';
import { useWalletSearch } from '@/utils/hooks/use-wallet-search';

import { WalletAddressTransactionsTable } from './WalletAddress/WalletAddressTransactions/WalletAddressTransactionsTable';

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

const Results = () => {
  const { data, status, error } = useAddressDetails();
  const { filterParams } = useWalletSearch();

  if (status === 'pending' && !data) {
    return <Loader height="auto" paddingTop="2rem" />;
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
        {renderCurrentResultType(data, filterParams.address)}
      </Stack>

      {data.operator && data.operator.role ? (
        <RoleDetails data={data.operator} />
      ) : null}
      {walletData ? <WalletAddress data={walletData} /> : null}
      {data.escrow && <EscrowAddress data={data.escrow} />}
      {showTransactions && <WalletAddressTransactionsTable />}
    </>
  );
};

enum ParamsStatus {
  LOADING = 'loading',
  ERROR = 'error',
  SUCCESS = 'success',
}

const SearchResults = () => {
  const location = useLocation();
  const { chainId: urlChainId, address: urlAddress } = useParams();
  const {
    setAddress,
    setChainId,
    filterParams: { chainId, address },
  } = useWalletSearch();

  const [paramsStatus, setParamsStatus] = useState<ParamsStatus>(
    ParamsStatus.LOADING
  );

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

  return (
    <PageWrapper className="standard-background">
      <Breadcrumbs title="Search Results" />
      <SearchBar />
      {paramsStatus === ParamsStatus.LOADING && (
        <Loader height="auto" paddingTop="2rem" />
      )}
      {paramsStatus === ParamsStatus.ERROR && (
        <Stack pt="2rem">Something went wrong</Stack>
      )}
      {paramsStatus === ParamsStatus.SUCCESS && <Results />}
    </PageWrapper>
  );
};

export default SearchResults;
