import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { Oracle } from '../../services/oracles.service';
import {
  MenuIcon,
  OracleAddressIcon,
  OracleRewardIcon,
} from '@/shared/components/ui/icons';
import { CopyToClipboardButton } from '@/shared/components/ui/copy-to-clipboard-button';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Button } from '@/shared/components/ui/button';
import { JOB_TYPES } from '@/shared/consts';
import { JobType } from '@/shared/types/entity.type';
import { ExploreTasksDialog } from './explore-tasks-dialog';
import { EvmAddress, RewardAmount } from '../../jobs/components';
import { useGetRegistrationDataInOracles } from '../hooks/use-get-registration-data-oracles';
import { shouldNavigateToRegistration } from '../helpers';
import { routerPaths } from '@/router/router-paths';

function JobTypesTooltipTitle({ jobTypes }: { jobTypes: string[] }) {
  return (
    <Stack sx={{ gap: 0.5 }}>
      {jobTypes.map((jobType) => {
        const element = JOB_TYPES.find((j) => j === jobType) as JobType;
        const label = t(`jobTypeLabels.${element}`);
        return (
          <Typography key={jobType} variant="body2">
            {label}
          </Typography>
        );
      })}
    </Stack>
  );
}

export function OracleJobCard({ oracle }: { oracle: Oracle }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTaskTypesOpen, setIsTaskTypesOpen] = useState(false);

  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data, isLoading } = useGetRegistrationDataInOracles();

  const isRewardAmountsEqual =
    oracle.minRewardAmount === oracle.maxRewardAmount;
  const hasTasks = oracle.nTasks > 0;

  const handleClickOnExploreTasks = () => {
    if (isLoading) return;

    if (shouldNavigateToRegistration(oracle, data)) {
      navigate(`${routerPaths.registrationInExchangeOracle}/${oracle.address}`);
      return;
    }

    setIsDialogOpen(true);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        px: { xs: 2, md: 2.5 },
        pt: { xs: 2, md: 3 },
        pb: { xs: 0, md: 2 },
        borderRadius: '20px',
        borderColor: 'border.strong',
        bgcolor: 'background.subtle',
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          gap: 1.5,
          '&:last-child': { pb: 0 },
        }}
      >
        <Typography
          variant={isMobile ? 'body3' : 'h6'}
          component="p"
          sx={{ color: 'text.auxiliary100' }}
        >
          {oracle.name}
        </Typography>
        <Stack sx={{ gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <OracleAddressIcon sx={{ color: 'text.primary' }} />
            <Typography variant="body2">
              {t('worker.oraclesList.address')}:
            </Typography>
            <EvmAddress address={oracle.address} />
            <CopyToClipboardButton
              value={oracle.address}
              sx={{
                '& svg': {
                  color: 'text.auxiliary100',
                  fontSize: 16,
                },
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <OracleRewardIcon sx={{ color: 'text.primary' }} />
            <Typography variant="body2">
              {t('worker.oraclesList.reward')}:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'text.auxiliary100',
              }}
            >
              {isRewardAmountsEqual ? (
                <RewardAmount
                  reward_amount={oracle.minRewardAmount}
                  reward_token={oracle.rewardToken}
                />
              ) : (
                <>
                  <RewardAmount
                    reward_amount={oracle.minRewardAmount}
                    reward_token={oracle.rewardToken}
                  />
                  -{' '}
                  <RewardAmount
                    reward_amount={oracle.maxRewardAmount}
                    reward_token={oracle.rewardToken}
                  />
                </>
              )}
            </Typography>
          </Box>
        </Stack>
        <Stack
          sx={{
            height: { xs: 'auto', md: 40 },
            py: { xs: 1.5, md: 1 },
            px: { xs: 2, md: 0 },
            mx: { xs: -2, md: 0 },
            gap: isTaskTypesOpen && hasTasks ? 1 : 0,
            borderTop: (theme) => ({
              xs: `1px solid ${theme.palette.border.main}`,
              md: 'none',
            }),
          }}
        >
          <Stack
            direction="row"
            sx={{
              gap: 2,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {isMobile ? (
              <Button
                variant="text"
                disableRipple
                startIcon={
                  <ExpandMoreIcon
                    sx={{
                      display: hasTasks ? 'block' : 'none',
                      mr: -0.5,
                      color: 'inherit',
                      transform: isTaskTypesOpen
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)',
                    }}
                  />
                }
                sx={{
                  p: 0,
                  bgcolor: 'transparent',
                  color: 'text.auxiliary200',
                }}
                onClick={() => hasTasks && setIsTaskTypesOpen(!isTaskTypesOpen)}
              >
                {oracle.nTasks}{' '}
                {oracle.nTasks === 1
                  ? t('worker.oraclesList.task')
                  : t('worker.oraclesList.tasks')}
              </Button>
            ) : (
              <Tooltip
                title={<JobTypesTooltipTitle jobTypes={oracle.jobTypes} />}
                disableHoverListener={isMobile || !hasTasks}
                slotProps={{
                  tooltip: {
                    sx: {
                      p: 1.5,
                      bgcolor: 'background.paper',
                      boxShadow: 'none',
                      borderRadius: '15px',
                      border: (theme) =>
                        `1px solid ${theme.palette.border.main}`,
                    },
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    color: 'text.auxiliary200',
                    fontWeight: 600,
                    cursor: hasTasks
                      ? { xs: 'default', md: 'pointer' }
                      : 'default',
                  }}
                >
                  <MenuIcon sx={{ color: 'inherit', fontSize: 20 }} />
                  {oracle.nTasks}{' '}
                  {oracle.nTasks === 1
                    ? t('worker.oraclesList.task')
                    : t('worker.oraclesList.tasks')}
                </Typography>
              </Tooltip>
            )}
            <Button
              variant="text"
              color="accent"
              disableRipple
              disabled={isLoading}
              sx={{
                display: hasTasks ? 'flex' : 'none',
                p: 0.5,
                gap: 0.5,
                bgcolor: 'transparent',
              }}
              onClick={handleClickOnExploreTasks}
            >
              {t('worker.oraclesList.exploreTasks')}{' '}
              <ArrowForwardIcon sx={{ color: 'inherit', fontSize: 20 }} />
            </Button>
          </Stack>
          <Collapse in={isMobile && isTaskTypesOpen && hasTasks}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              {oracle.jobTypes.map((jobType) => {
                const element = JOB_TYPES.find((j) => j === jobType) as JobType;
                const label = t(`jobTypeLabels.${element}`);
                return (
                  <Chip
                    key={label}
                    label={label}
                    sx={{
                      color: 'text.primary',
                      bgcolor: 'background.subtle',
                      borderColor: 'border.strong',
                    }}
                  />
                );
              })}
            </Stack>
          </Collapse>
        </Stack>
      </CardContent>
      <ExploreTasksDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        oracle={oracle}
      />
    </Card>
  );
}
