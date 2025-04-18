import PageWrapper from '@components/PageWrapper';
import Stack from '@mui/material/Stack';
import ShadowIcon from '@components/ShadowIcon';
import Clipboard from '@components/Clipboard';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import EscrowAddress from '@pages/SearchResults/EscrowAddress';
import WalletAddress from '@pages/SearchResults/WalletAddress';
import NothingFound from '@components/NothingFound';
import Breadcrumbs from '@components/Breadcrumbs';
import SearchBar from '@components/SearchBar/SearchBar';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import Loader from '@components/Loader';
import { getNetwork } from '@utils/config/networks';
import {
  AddressDetails,
  AddressDetailsWallet,
  useAddressDetails,
} from '@services/api/use-address-details';
import { handleErrorMessage } from '@services/handle-error-message';
import RoleDetails from '@pages/SearchResults/RoleDetails/RoleDetails';
import { AxiosError } from 'axios';
import { WalletIcon } from '@components/Icons/WalletIcon';
import { EscrowAddressIcon } from '@components/Icons/EscrowAddressIcon';

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

  const selectedWalletData: AddressDetailsWallet | undefined =
    data.wallet ||
    (data.operator && data.operator.role === null ? data.operator : undefined);

  return (
    <>
      <Stack
        sx={{ marginBottom: 2, marginTop: { xs: 2, md: 4 } }}
        direction={{ xs: 'column', md: 'row' }}
        gap={3}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        {renderCurrentResultType(data, filterParams.address)}
      </Stack>

      {data.operator && data.operator.role ? (
        <RoleDetails data={data.operator} />
      ) : null}
      {selectedWalletData ? <WalletAddress data={selectedWalletData} /> : null}
      {data.escrow ? <EscrowAddress data={data.escrow} /> : null}
    </>
  );
};

const SearchResults = () => {
  const location = useLocation();
  const { chainId: urlChainId, address: urlAddress } = useParams();
  const {
    setAddress,
    setChainId,
    filterParams: { chainId, address },
  } = useWalletSearch();
  const [paramsStatus, setParamsStatus] = useState<
    'loading' | 'error' | 'success'
  >('loading');

  useEffect(() => {
    setParamsStatus('loading');
  }, [location]);

  useEffect(() => {
    if (paramsStatus === 'success') return;
    if (urlAddress) {
      setAddress(urlAddress);
    } else {
      setParamsStatus('error');
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
      setParamsStatus('error');
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
    if (address && chainId && paramsStatus !== 'success') {
      setParamsStatus('success');
    }
  }, [address, chainId, paramsStatus]);

  return (
    <PageWrapper className="standard-background">
      <Breadcrumbs title="Search Results" />
      <SearchBar className="search-results-bar" />
      {paramsStatus === 'loading' && <Loader height="auto" paddingTop="2rem" />}
      {paramsStatus === 'error' && (
        <Stack sx={{ paddingTop: '2rem' }}>Something went wrong</Stack>
      )}
      {paramsStatus === 'success' && <Results />}
    </PageWrapper>
  );
};

export default SearchResults;
