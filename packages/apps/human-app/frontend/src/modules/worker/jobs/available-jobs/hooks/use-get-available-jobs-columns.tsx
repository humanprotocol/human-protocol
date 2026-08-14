import { useMemo } from 'react';
import type { MRT_ColumnDef } from 'material-react-table';
import { t } from 'i18next';
import { Box, Chip, Stack, Typography } from '@mui/material';

import { TableButton } from '@/shared/components/ui/table-button';
import type { JobType } from '@/shared/types/entity.type';
import { useJobsNotifications } from '../../hooks';
import { EvmAddress, RewardAmount } from '../../components';
import { type AvailableJob } from '../../types';
import { useAssignJobMutation } from './use-assign-job';
import { Button } from '@/shared/components/ui/button';
import { useModal } from '@/shared/contexts/modal-context';
import { ChainIcon } from '@/shared/components/ui/chain-icon';

const COL_SIZE = 50;
const COL_SIZE_MD = 100;
const COL_SIZE_LG = 150;
const COL_SIZE_XL = 250;

export const useGetAvailableJobsColumns = (): MRT_ColumnDef<AvailableJob>[] => {
  const { openModal } = useModal();

  return useMemo(
    () => [
      {
        accessorKey: 'escrow_address',
        header: t('worker.jobs.address'),
        size: COL_SIZE,
        enableSorting: false,
        Cell: (props) => {
          return (
            <EvmAddress
              address={props.cell.getValue() as string}
              size="medium"
            />
          );
        },
      },
      {
        accessorKey: 'chain_id',
        header: t('worker.jobs.network'),
        size: COL_SIZE,
        enableSorting: false,
        Cell: (props) => {
          return <ChainIcon chainId={props.row.original.chain_id} />;
        },
      },
      {
        accessorKey: 'reward_amount',
        header: t('worker.jobs.reward'),
        size: COL_SIZE_MD,
        enableSorting: false,
        Cell: (props) => {
          const { reward_amount, reward_token } = props.row.original;
          return (
            <RewardAmount
              reward_amount={reward_amount}
              reward_token={reward_token}
              color="text.auxiliary100"
            />
          );
        },
      },
      {
        accessorKey: 'job_type',
        header: t('worker.jobs.jobType'),
        size: COL_SIZE_LG,
        enableSorting: false,
        Cell: ({ row }) => {
          const label = t(`jobTypeLabels.${row.original.job_type as JobType}`);
          return (
            <Chip
              label={label}
              sx={{
                color: 'text.primary',
                bgcolor: 'background.subtle',
                borderColor: 'border.strong',
                maxWidth: { xs: 'fit-content', md: '150px', lg: 'fit-content' },
              }}
            />
          );
        },
      },
      {
        accessorKey: 'escrow_address',
        id: 'selectJobAction',
        header: t('worker.jobs.action'),
        size: COL_SIZE_XL,
        enableSorting: false,
        Cell: (props) => {
          const { escrow_address, chain_id, job_description } =
            props.row.original;
          const { onJobAssignmentError, onJobAssignmentSuccess } =
            useJobsNotifications();
          const { mutate: assignJobMutation, isPending } = useAssignJobMutation(
            {
              onSuccess: onJobAssignmentSuccess,
              onError: onJobAssignmentError,
            },
            [`assignJob-${escrow_address}`]
          );
          const description = job_description?.trim() || '';

          const handleOpenTaskDescription = () => {
            openModal({
              content: (
                <Stack sx={{ gap: 2 }}>
                  <Typography variant="h6">
                    {t('worker.jobs.jobDescription')}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.auxiliary100',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {description}
                  </Typography>
                </Stack>
              ),
            });
          };

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
              {description && (
                <Button
                  size="small"
                  variant="outlined"
                  disabled={isPending}
                  onClick={handleOpenTaskDescription}
                >
                  {t('worker.jobs.taskDescription')}
                </Button>
              )}
              <TableButton
                sx={{ width: '94px' }}
                disabled={isPending}
                onClick={() => assignJobMutation({ escrow_address, chain_id })}
              >
                {t('worker.jobs.claimTask')}
              </TableButton>
            </Box>
          );
        },
      },
    ],
    [openModal]
  );
};
