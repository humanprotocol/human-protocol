/* eslint-disable camelcase -- ... */
import { t } from 'i18next';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import type { AvailableJob } from '@/api/servieces/worker/available-jobs-data';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import type { AvailableJobTableData } from '@/pages/worker/jobs/components/avaible-jobs/available-jobs-table';
import { getNetworkName } from '@/smart-contracts/get-network-name';

export const mapAvailableJobsResponseToTableData = (
  responseData: AvailableJob[]
): AvailableJobTableData[] => {
  return responseData.map(
    ({
      job_description,
      chain_id,
      job_type,
      reward_amount,
      reward_token,
      escrow_address,
    }) => ({
      jobDescription: job_description,
      network: getNetworkName(chain_id),
      jobTypeChips: <Chip label={job_type} />,
      rewardTokenInfo: (() => {
        if (!(reward_amount !== undefined && reward_token)) {
          return '';
        }
        const hasDecimals = reward_amount - Math.floor(reward_amount) !== 0;
        if (hasDecimals) {
          return (
            <Tooltip title={`${reward_amount} ${reward_token}`}>
              <Typography variant="body2">
                {`${reward_amount.toFixed(2)} ${reward_token}`}
              </Typography>
            </Tooltip>
          );
        }
        return `${reward_amount} ${reward_token}`;
      })(),
      escrowAddress: escrow_address,
      buttonColumn: (
        <Button
          color="secondary"
          size="small"
          type="button"
          variant="contained"
        >
          {t('worker.jobs.selectJob')}
        </Button>
      ),
    })
  );
};
