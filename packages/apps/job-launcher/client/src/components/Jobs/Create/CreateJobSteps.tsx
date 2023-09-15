import { Box, Typography } from '@mui/material';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { CreateJobStep } from '../../../types';

const STEPS = [
  { value: CreateJobStep.FundingMethod, title: 'Funding Method' },
  { value: CreateJobStep.CreateJob, title: 'Create Job' },
  { value: CreateJobStep.PayJob, title: 'Pay Job' },
  { value: CreateJobStep.Launch, title: 'Launch' },
];

const Step = ({
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

export const CreateJobSteps = () => {
  const { step } = useCreateJobPageUI();
  return (
    <Box
      sx={{
        borderRadius: '16px',
        background: '#fff',
        boxShadow:
          '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
        p: '14px 42px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {STEPS.map((s, i) => (
        <Step
          key={s.value}
          index={i + 1}
          title={s.title}
          selected={s.value <= step}
        />
      ))}
    </Box>
  );
};
