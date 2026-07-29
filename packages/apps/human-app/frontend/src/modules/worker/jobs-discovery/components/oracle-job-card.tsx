import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
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
import { useColorMode } from '@/shared/contexts/color-mode';
import { shortenEscrowAddress } from '@/shared/helpers/evm';
import { CopyToClipboardButton } from '@/shared/components/ui/copy-to-clipboard-button';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Button } from '@/shared/components/ui/button';
import { JOB_TYPES } from '@/shared/consts';
import { JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { Chip } from '@/shared/components/ui/chip';

function JobTypesTooltipTitle({ jobTypes }: { jobTypes: string[] }) {
  return (
    <Stack sx={{ gap: 0.5 }}>
      {jobTypes.map((jobType) => {
        const element = JOB_TYPES.find((j) => j === jobType) as JobType;
        const label = t(`jobTypeLabels.${element}`);
        return (
          <Typography
            key={jobType}
            variant="body2"
            sx={{
              color: 'text.primary',
              fontWeight: 500,
              letterSpacing: '0.12px',
            }}
          >
            {label}
          </Typography>
        );
      })}
    </Stack>
  );
}

export function OracleJobCard({ oracle }: { oracle: Oracle }) {
  const [isTaskTypesOpen, setIsTaskTypesOpen] = useState(false);

  const { colorPalette } = useColorMode();
  const isMobile = useIsMobile();

  return (
    <Card
      variant="outlined"
      sx={{
        px: { xs: 2, md: 2.5 },
        pt: { xs: 2, md: 3 },
        pb: { xs: 0, md: 2 },
        borderRadius: '20px',
        borderColor: colorPalette.border.strong,
        bgcolor: colorPalette.background.subtle,
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          gap: 2.5,
          '&:last-child': { pb: 0 },
        }}
      >
        <Typography
          variant={isMobile ? 'body1' : 'h5'}
          sx={{
            color: colorPalette.text.auxiliary100,
            fontWeight: 600,
            letterSpacing: '0.12px',
          }}
        >
          {oracle.name}
        </Typography>
        <Stack sx={{ gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <OracleAddressIcon sx={{ color: colorPalette.text.primary }} />
            <Typography
              variant="body2"
              sx={{
                color: colorPalette.text.primary,
                fontWeight: 500,
                letterSpacing: '0.12px',
              }}
            >
              {t('worker.oraclesList.address')}:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colorPalette.text.auxiliary200,
                fontWeight: 500,
                letterSpacing: '0.12px',
              }}
            >
              {shortenEscrowAddress(oracle.address, 4, 4)}
            </Typography>
            <CopyToClipboardButton
              value={oracle.address}
              sx={{
                '& svg': {
                  color: colorPalette.text.auxiliary100,
                  fontSize: 16,
                },
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <OracleRewardIcon sx={{ color: colorPalette.text.primary }} />
            <Typography
              variant="body2"
              sx={{
                color: colorPalette.text.primary,
                fontWeight: 500,
                letterSpacing: '0.12px',
              }}
            >
              {t('worker.oraclesList.reward')}:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colorPalette.text.auxiliary200,
                fontWeight: 500,
                letterSpacing: '0.12px',
              }}
            >
              1 HMT - 2 HMT
            </Typography>
          </Box>
        </Stack>
        <Stack
          sx={{
            py: { xs: 2, md: 1 },
            px: { xs: 2, md: 0 },
            mx: { xs: -2, md: 0 },
            gap: isTaskTypesOpen ? 1 : 0,
            borderTop: {
              xs: `1px solid ${colorPalette.border.main}`,
              md: 'none',
            },
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
                  color: colorPalette.text.auxiliary200,
                }}
                onClick={() => setIsTaskTypesOpen(!isTaskTypesOpen)}
              >
                {oracle.jobTypes.length}{' '}
                {oracle.jobTypes.length > 1
                  ? t('worker.oraclesList.taskTypes')
                  : t('worker.oraclesList.taskType')}
              </Button>
            ) : (
              <Tooltip
                title={<JobTypesTooltipTitle jobTypes={oracle.jobTypes} />}
                disableHoverListener={isMobile}
                disableFocusListener={isMobile}
                disableTouchListener={isMobile}
                slotProps={{
                  tooltip: {
                    sx: {
                      p: 1.5,
                      bgcolor: colorPalette.background.paper,
                      boxShadow: 'none',
                      borderRadius: '15px',
                      border: `1px solid ${colorPalette.border.main}`,
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
                    color: colorPalette.text.auxiliary200,
                    fontWeight: 600,
                    cursor: { xs: 'default', md: 'pointer' },
                  }}
                >
                  <MenuIcon sx={{ color: 'inherit', fontSize: 20 }} />
                  {oracle.jobTypes.length}{' '}
                  {oracle.jobTypes.length > 1
                    ? t('worker.oraclesList.taskTypes')
                    : t('worker.oraclesList.taskType')}
                </Typography>
              </Tooltip>
            )}
            <Button
              variant="text"
              disableRipple
              sx={{
                p: 0,
                gap: 0.5,
                bgcolor: 'transparent',
                color: colorPalette.accent.main,
              }}
            >
              {t('worker.oraclesList.exploreTasks')}{' '}
              <ArrowForwardIcon
                sx={{ color: colorPalette.accent.main, fontSize: 20 }}
              />
            </Button>
          </Stack>
          <Collapse in={isMobile && isTaskTypesOpen}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              {oracle.jobTypes.map((jobType) => {
                const element = JOB_TYPES.find((j) => j === jobType) as JobType;
                const label = t(`jobTypeLabels.${element}`);
                return (
                  <Chip
                    label={label}
                    backgroundColor={colorPalette.accent.main}
                  />
                );
              })}
            </Stack>
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  );
}
