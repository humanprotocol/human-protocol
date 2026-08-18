import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { RegistrationForm } from '@/modules/worker/oracle-registration/registration-form';
import { Loader } from '@/shared/components/ui/loader';
import { routerPaths } from '@/router/router-paths';
import { useGetOracles } from '../hooks';
import { useIsAlreadyRegistered } from './hooks';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { BackButton } from '@/shared/components/ui/page-card/back-button';

function isAddress(address: string | undefined): address is string {
  return address !== undefined && address.length > 0;
}

export function RegistrationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { address: oracleAddress } = useParams<{ address: string }>();

  const { data, isLoading } = useGetOracles();
  const { registered, isPending } = useIsAlreadyRegistered(oracleAddress);

  const oracleData = data?.find((o) => o.address === oracleAddress);
  const backRoute = routerPaths.jobsDiscovery;

  if (oracleData === undefined || !isAddress(oracleAddress)) {
    return <Navigate to={backRoute} />;
  }

  if (registered || !oracleData.registrationNeeded) {
    return <Navigate to={backRoute} />;
  }

  const handleBack = () => {
    navigate(backRoute);
  };

  return (
    <Stack sx={{ minHeight: '100%' }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          p: { xs: 0, md: 4 },
          mx: { xs: 2, md: 0 },
          gap: { xs: 1, md: 0 },
          borderBottom: (theme) => ({
            xs: 'none',
            md: `1px solid ${theme.palette.border.main}`,
          }),
        }}
      >
        {isMobile && <BackButton onClick={handleBack} />}
        <Typography variant="pageHeading">
          {t('protectedPagesHeaders.registrationInExchangeOracle')}
        </Typography>
      </Stack>
      {isLoading || isPending ? (
        <Stack sx={{ flex: 1, justifyContent: 'center', m: 'auto', my: 5 }}>
          <Loader />
        </Stack>
      ) : (
        <Stack
          sx={{
            flex: 1,
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: { xs: 'flex-start', md: 'center' },
            m: 'auto',
            my: { xs: 5, md: 'auto' },
            px: { xs: 2, md: 0 },
            gap: 3,
            maxWidth: { xs: '100%', md: '350px' },
          }}
        >
          <Typography sx={{ color: 'text.auxiliary100' }}>
            {t('worker.registrationInExchangeOracle.requiredMessage')}
          </Typography>
          <RegistrationForm
            address={oracleAddress}
            oracleInstructions={oracleData.registrationInstructions}
          />
        </Stack>
      )}
    </Stack>
  );
}
