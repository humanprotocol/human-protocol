import { Box, Typography } from '@mui/material';
import { RoundedBox } from './RoundedBox';
import { FortuneStageStatus } from './types';

const STAGES = [
  { status: FortuneStageStatus.FUNDING_METHOD, title: 'Funding Method' },
  { status: FortuneStageStatus.JOB_REQUEST, title: 'Job Request' },
  { status: FortuneStageStatus.LAUNCH, title: 'Launch' },
];

const Stage = ({
  index,
  selected,
  title,
}: {
  index: number;
  selected: boolean;
  title: string;
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          width: '40px',
          height: '40px',
          borderRadius: '100%',
          background: selected ? '#320A8D' : 'rgba(203, 207, 232, 0.52)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" color={selected ? 'white' : 'primary'}>
          {index}
        </Typography>
      </Box>
      <Typography sx={{ ml: 2 }} color="primary" fontWeight={500}>
        {title}
      </Typography>
    </Box>
  );
};

type FortuneStagesProps = {
  status: FortuneStageStatus;
};

export const FortuneStages = ({ status }: FortuneStagesProps) => {
  return (
    <RoundedBox
      sx={{
        p: '14px 42px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {STAGES.map((stage, i) => (
        <Stage
          key={stage.status}
          index={i + 1}
          title={stage.title}
          selected={stage.status <= status}
        />
      ))}
    </RoundedBox>
  );
};
