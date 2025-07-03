import Chip from '@mui/material/Chip';
import useTheme from '@mui/material/styles/useTheme';

import type { Reputation } from '@/shared/model/reputationSchema';

type Props = {
  reputation: Reputation;
};

type ReputationAttributes = {
  title: string;
  colors: { title: string; border: string };
};

const ReputationScore = ({ reputation }: Props) => {
  const theme = useTheme();

  const reputationAttributes: Record<Reputation, ReputationAttributes> = {
    high: {
      title: 'High',
      colors: {
        title: theme.palette.success.main,
        border: theme.palette.success.light,
      },
    },
    medium: {
      title: 'Medium',
      colors: {
        title: theme.palette.warning.main,
        border: theme.palette.warning.light,
      },
    },
    low: {
      title: 'Low',
      colors: {
        title: theme.palette.orange.main,
        border: theme.palette.orange.light,
      },
    },
    unknown: {
      title: 'Coming soon',
      colors: {
        title: theme.palette.ocean.main,
        border: theme.palette.ocean.light,
      },
    },
  };

  const colors = reputationAttributes[reputation].colors;

  return (
    <Chip
      label={reputationAttributes[reputation].title}
      variant="outlined"
      sx={{
        borderColor: colors.border,
        color: colors.title,
      }}
    />
  );
};

export default ReputationScore;
