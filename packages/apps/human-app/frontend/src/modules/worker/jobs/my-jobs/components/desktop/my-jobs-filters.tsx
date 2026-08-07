import { useEffect, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';

import { FilterIcon } from '@/shared/components/ui/icons';
import { useColorMode } from '@/shared/contexts/color-mode';
import { ResponsiveOverlay } from '@/shared/components/ui/responsive-overlay';
import { useGetOracles } from '@/modules/worker/hooks/use-get-oracles';
import { Alert } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useMyJobsFilterStore } from '../../../hooks';
import { type StatusFilterType } from '../../../types';
import { STATUS_FILTER_OPTIONS } from './status-filter';

const CVAT_ORACLE_NAME = 'cvat';

const getDefaultOracleAddress = (
  oracles: { address: string; name: string }[] | undefined
) => {
  if (!oracles?.length) {
    return undefined;
  }

  return (
    oracles.find((oracle) =>
      oracle.name.toLowerCase().includes(CVAT_ORACLE_NAME)
    )?.address ?? oracles[0].address
  );
};

export function MyJobsFilters() {
  const [isOpen, setIsOpen] = useState(false);
  const [draftOracleAddress, setDraftOracleAddress] = useState('');
  const [draftStatus, setDraftStatus] = useState<StatusFilterType>('');

  const { colorPalette } = useColorMode();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { filterParams, setFilterParams } = useMyJobsFilterStore();

  const { data: oraclesData, isError, isPending } = useGetOracles();

  const defaultOracleAddress = getDefaultOracleAddress(oraclesData);
  const selectedOracleAddress =
    filterParams.oracle_address ?? defaultOracleAddress ?? '';
  const selectedStatus = filterParams.status ?? '';

  useEffect(() => {
    if (!filterParams.oracle_address && defaultOracleAddress) {
      setFilterParams({ oracle_address: defaultOracleAddress });
    }
  }, [defaultOracleAddress, filterParams.oracle_address, setFilterParams]);

  useEffect(() => {
    if (isOpen) {
      setDraftOracleAddress(selectedOracleAddress);
      setDraftStatus(selectedStatus);
    }
  }, [isOpen, selectedOracleAddress, selectedStatus]);

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    setFilterParams({
      oracle_address: draftOracleAddress,
      status: draftStatus,
    });
    setIsOpen(false);
  };

  return (
    <>
      <IconButton
        disabled={isPending}
        sx={{
          position: 'relative',
          p: 1.5,
          bgcolor: 'transparent',
          borderRadius: '50%',
          border: `1px solid ${colorPalette.border.main}`,
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FilterIcon sx={{ color: colorPalette.text.auxiliary200 }} />
        <Box
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            p: 0.5,
            borderRadius: '50%',
            bgcolor: colorPalette.accent.main,
          }}
        />
      </IconButton>
      <ResponsiveOverlay
        open={isOpen}
        onClose={() => setIsOpen(false)}
        desktopSx={{ p: 0 }}
        mobileSx={{ p: 0 }}
      >
        <Stack component="form" onSubmit={handleSubmit} sx={{ gap: 3 }}>
          <Stack sx={{ py: { xs: 2, md: 4 }, px: 2, gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('worker.jobs.jobsFilter')}
            </Typography>
            <Stack sx={{ gap: 1 }}>
              <Typography
                variant="body1"
                sx={{ color: colorPalette.text.auxiliary200, fontWeight: 500 }}
              >
                {t('worker.jobs.oracles')}
              </Typography>
              {isError && (
                <Alert color="error" severity="error">
                  {t('worker.oraclesTable.error.gettingOracles')}
                </Alert>
              )}
              <RadioGroup
                value={draftOracleAddress}
                onChange={(_, oracleAddress) => {
                  setDraftOracleAddress(oracleAddress);
                }}
              >
                {(oraclesData ?? []).map((oracle) => (
                  <FormControlLabel
                    key={`${oracle.address}-${oracle.chainId}`}
                    control={<Radio color="accent" />}
                    label={
                      <Typography
                        variant="body1"
                        sx={{ color: colorPalette.text.auxiliary100 }}
                      >
                        {oracle.name}
                      </Typography>
                    }
                    value={oracle.address}
                  />
                ))}
              </RadioGroup>
            </Stack>
            {isMobile && (
              <Stack sx={{ gap: 1 }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: colorPalette.text.auxiliary200,
                    fontWeight: 500,
                  }}
                >
                  {t('worker.jobs.status')}
                </Typography>
                <RadioGroup
                  value={draftStatus}
                  onChange={(_, status) => {
                    setDraftStatus(status as StatusFilterType);
                  }}
                >
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      control={<Radio color="accent" />}
                      label={
                        <Typography
                          variant="body1"
                          sx={{ color: colorPalette.text.auxiliary100 }}
                        >
                          {t(option.labelKey)}
                        </Typography>
                      }
                      value={option.value}
                    />
                  ))}
                </RadioGroup>
              </Stack>
            )}
          </Stack>
          <Stack
            direction="row"
            sx={{
              p: 2,
              justifyContent: 'flex-end',
              borderTop: `1px solid ${colorPalette.border.main}`,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              color="accent"
              disabled={isError || !draftOracleAddress}
              sx={{ width: { xs: '100%', md: '200px' } }}
            >
              {t('worker.jobs.applyFilters')}
            </Button>
          </Stack>
        </Stack>
      </ResponsiveOverlay>
    </>
  );
}
